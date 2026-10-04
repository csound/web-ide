import { randomUUID } from "node:crypto";
import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { error as logError } from "firebase-functions/logger";
import { createRequestLimiter } from "./public_requests.js";

const limitRequests = createRequestLimiter();
const MAX_FILES = 400;
const MAX_BINARY_BYTES = 100 * 1024 * 1024;

function documentId(value: unknown): value is string {
    return (
        typeof value === "string" &&
        !!value &&
        !value.includes("/") &&
        value !== "." &&
        value !== ".." &&
        Buffer.byteLength(value) <= 1500
    );
}

function text(value: unknown, max: number, required = false): string {
    if (
        typeof value !== "string" ||
        value.length > max ||
        (required && !value.trim())
    ) {
        throw new HttpsError(
            "invalid-argument",
            "Check the project details and try again."
        );
    }
    return value.trim();
}

function canFork(
    project: FirebaseFirestore.DocumentData | undefined,
    uid: string
) {
    if (!project || (project.public !== true && project.userUid !== uid)) {
        throw new HttpsError(
            "permission-denied",
            "This project is hidden or no longer exists."
        );
    }
}

/** Copy saved content, then publish the complete project in one transaction. */
export const forkProject = onCall(
    { cors: true, timeoutSeconds: 300, maxInstances: 3, concurrency: 5 },
    async ({ data, auth }) => {
        if (!auth?.uid)
            throw new HttpsError(
                "unauthenticated",
                "Sign in to fork a project."
            );
        limitRequests();
        if (
            !documentId(data?.sourceProjectUid) ||
            typeof data?.public !== "boolean"
        ) {
            throw new HttpsError(
                "invalid-argument",
                "Choose a project and its visibility."
            );
        }
        const details = {
            name: text(data.name, 200, true),
            description: text(data.description, 5000),
            iconName: text(data.iconName, 100, true),
            iconForegroundColor: text(data.iconForegroundColor, 7, true),
            iconBackgroundColor: text(data.iconBackgroundColor, 7, true),
            public: data.public
        };
        if (
            ![details.iconForegroundColor, details.iconBackgroundColor].every(
                (color) => /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(color)
            )
        ) {
            throw new HttpsError(
                "invalid-argument",
                "Choose valid icon colors."
            );
        }
        if (!Array.isArray(data.tags) || data.tags.length > 20) {
            throw new HttpsError("invalid-argument", "Choose up to 20 tags.");
        }
        const tags = [
            ...new Set<string>(
                data.tags.map((tag: unknown) => text(tag, 64, true))
            )
        ];
        if (!tags.every(documentId))
            throw new HttpsError(
                "invalid-argument",
                "Tags cannot contain slashes."
            );

        const db = admin.firestore();
        const sourceRef = db.collection("projects").doc(data.sourceProjectUid);
        const destination = db.collection("projects").doc();
        const { source, files, targets } = await db.runTransaction(
            async (transaction) => {
                const source = (await transaction.get(sourceRef)).data();
                canFork(source, auth.uid);
                const files = await transaction.get(
                    sourceRef.collection("files").limit(MAX_FILES + 1)
                );
                const targets = (
                    await transaction.get(
                        db.collection("targets").doc(sourceRef.id)
                    )
                ).data();
                return { source, files, targets };
            }
        );
        if (files.size > MAX_FILES)
            throw new HttpsError(
                "resource-exhausted",
                "This project has too many files to fork at once (400 maximum)."
            );
        // Leave room under Firestore's 10 MiB transaction limit.
        if (
            Buffer.byteLength(
                JSON.stringify([files.docs.map((file) => file.data()), targets])
            ) >
            8 * 1024 * 1024
        ) {
            throw new HttpsError(
                "resource-exhausted",
                "This project's text is too large to fork at once."
            );
        }
        if (!documentId(source.userUid))
            throw new HttpsError(
                "failed-precondition",
                "This project has no valid owner."
            );

        const bucket = admin
            .storage()
            .bucket(process.env.STORAGE_BUCKET_URL?.trim() || undefined);
        const copiedPaths: string[] = [];
        let commitAttempted = false;
        let binaryBytes = 0;
        const timestamp = FieldValue.serverTimestamp();
        const copiedFiles = files.docs.map((file) => {
            const record = file.data();
            if (
                !["txt", "bin", "folder"].includes(record.type) ||
                typeof record.name !== "string"
            ) {
                throw new HttpsError(
                    "failed-precondition",
                    "This project contains an unreadable file."
                );
            }
            return {
                id: file.id,
                data: {
                    name: record.name,
                    type: record.type,
                    value: record.type === "txt" ? record.value || "" : "",
                    path: record.path || [],
                    userUid: auth.uid,
                    created: timestamp,
                    lastModified: timestamp
                }
            };
        });
        try {
            for (const file of copiedFiles) {
                if (file.data.type !== "bin") continue;
                // The project owner fixes the source path; never trust a file's userUid.
                const sourceFile = bucket.file(
                    `${source.userUid}/${sourceRef.id}/${file.id}`
                );
                const [metadata] = await sourceFile.getMetadata();
                binaryBytes += Number(metadata.size);
                if (
                    !Number.isFinite(binaryBytes) ||
                    binaryBytes > MAX_BINARY_BYTES
                ) {
                    throw new HttpsError(
                        "resource-exhausted",
                        "This project's audio and other files exceed the 100 MB fork limit."
                    );
                }
                const destinationPath = `${auth.uid}/${destination.id}/${file.id}`;
                copiedPaths.push(destinationPath);
                await bucket
                    .file(sourceFile.name, { generation: metadata.generation })
                    .copy(bucket.file(destinationPath), {
                        // The fork transaction writes file records, not the upload handler.
                        // File.copy sends these options as the Storage object resource.
                        metadata: {
                            userUid: auth.uid,
                            projectUid: destination.id,
                            docUid: file.id,
                            filename: file.data.name,
                            forkCopy: "true",
                            firebaseStorageDownloadTokens: randomUUID()
                        },
                        preconditionOpts: { ifGenerationMatch: 0 }
                    });
            }
            commitAttempted = true;
            await db.runTransaction(async (transaction) => {
                // A source may become private while its binary files are being copied.
                const currentSource = (await transaction.get(sourceRef)).data();
                canFork(currentSource, auth.uid);
                if (currentSource.userUid !== source.userUid)
                    throw new HttpsError(
                        "aborted",
                        "The source changed. Please try again."
                    );
                transaction.create(destination, {
                    ...details,
                    userUid: auth.uid,
                    created: timestamp,
                    starCount: 0,
                    forkedFrom: sourceRef.id,
                    forkedAt: timestamp
                });
                for (const file of copiedFiles)
                    transaction.create(
                        destination.collection("files").doc(file.id),
                        file.data
                    );
                transaction.create(
                    db.collection("targets").doc(destination.id),
                    {
                        targets: targets?.targets || {},
                        defaultTarget: targets?.defaultTarget || ""
                    }
                );
                transaction.create(
                    db.collection("projectLastModified").doc(destination.id),
                    { timestamp }
                );
                for (const tag of tags)
                    transaction.set(
                        db.collection("tags").doc(tag),
                        { [destination.id]: auth.uid },
                        { merge: true }
                    );
            });
            return { projectUid: destination.id };
        } catch (error) {
            if (commitAttempted && !(error instanceof HttpsError)) {
                // A lost commit response does not mean the transaction failed.
                // Keep its files if we cannot confirm the outcome.
                const result = await destination.get().catch(() => undefined);
                if (result?.exists) return { projectUid: destination.id };
                if (result === undefined) {
                    logError(
                        "Could not confirm fork commit",
                        destination.id,
                        error
                    );
                    throw new HttpsError(
                        "unavailable",
                        "Could not confirm the fork. Check your profile before trying again."
                    );
                }
            }
            // No project is visible until every file has been copied successfully.
            await Promise.all(
                copiedPaths.map(async (path) => {
                    try {
                        await bucket
                            .file(path)
                            .delete({ ignoreNotFound: true });
                    } catch (cleanupError) {
                        logError(
                            "Could not remove an unfinished fork file",
                            path,
                            cleanupError
                        );
                    }
                })
            );
            if (error instanceof HttpsError) throw error;
            logError("Could not fork project", sourceRef.id, error);
            throw new HttpsError(
                "internal",
                "Could not copy all project files. Please try again."
            );
        }
    }
);
