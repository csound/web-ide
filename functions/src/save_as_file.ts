import {
    FieldValue,
    getFirestore,
    type Firestore
} from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { createRequestLimiter } from "./public_requests.js";
import {
    destinationError,
    requestError,
    sameFolder,
    type SaveAsEntry,
    type SaveAsRequest,
    type SaveAsResult
} from "./save_as_validation.js";

const limitRequests = createRequestLimiter();

/** Query current names in the same transaction that creates the copy. */
export async function saveAsFile(
    database: Firestore,
    uid: string | undefined,
    data: unknown
): Promise<SaveAsResult> {
    if (!uid)
        throw new HttpsError("unauthenticated", "Sign in to save a copy.");
    const error = requestError(data);
    if (error) throw new HttpsError("invalid-argument", error);
    const { projectUid, filename, value, path, folders } =
        data as SaveAsRequest;
    const projectRef = database.collection("projects").doc(projectUid);
    const files = projectRef.collection("files");
    const dateRef = database.collection("projectLastModified").doc(projectUid);
    const file = files.doc();
    return database.runTransaction(async (transaction) => {
        const project = (await transaction.get(projectRef)).data();
        if (!project || project.userUid !== uid)
            throw new HttpsError(
                "permission-denied",
                "You no longer have write access to this project."
            );
        // All Save As calls read and write this record, including empty folders.
        // A retry repeats the name query rather than using a previous snapshot.
        await transaction.get(dateRef);
        const snapshot = await transaction.get(
            files.select("name", "type", "path")
        );
        const entries = snapshot.docs.map((entry): SaveAsEntry => ({
            id: entry.id,
            name: entry.data().name,
            type: entry.data().type,
            path: entry.data().path || []
        }));
        const newFolders: SaveAsEntry[] = [];
        for (const [index, id] of path.entries()) {
            const parent = path.slice(0, index);
            const existing = entries.find((entry) => entry.id === id);
            if (existing) {
                if (
                    existing.type !== "folder" ||
                    !sameFolder(existing.path, parent)
                )
                    throw new HttpsError(
                        "failed-precondition",
                        "The destination folder moved. Choose it again."
                    );
            } else {
                const folder = folders.find((entry) => entry.id === id);
                if (!folder || !sameFolder(folder.path, parent))
                    throw new HttpsError(
                        "failed-precondition",
                        "The destination folder was removed. Choose another folder."
                    );
                const error = destinationError(folder.name, parent, [
                    ...entries,
                    ...newFolders
                ]);
                if (error) throw new HttpsError("already-exists", error);
                newFolders.push(folder);
            }
        }
        const error = destinationError(filename, path, [
            ...entries,
            ...newFolders
        ]);
        if (error) throw new HttpsError("already-exists", error);
        const created: SaveAsEntry[] = [
            ...newFolders.map(({ id, name, path }) => ({
                id,
                name,
                path,
                type: "folder"
            })),
            { id: file.id, name: filename, path, type: "txt" }
        ];
        for (const entry of created)
            transaction.create(files.doc(entry.id), {
                name: entry.name,
                type: entry.type,
                path: entry.path,
                value: entry.id === file.id ? value : "",
                userUid: uid,
                created: FieldValue.serverTimestamp(),
                lastModified: FieldValue.serverTimestamp()
            });
        transaction.set(
            dateRef,
            { timestamp: FieldValue.serverTimestamp() },
            { merge: true }
        );
        return {
            project: {
                id: projectUid,
                name: project.name,
                isPublic: project.public === true
            },
            documentUid: file.id,
            entries: created
        };
    });
}

export const saveAsFileCallable = onCall(
    { cors: true, maxInstances: 3, concurrency: 20 },
    async ({ data, auth }) => {
        if (!auth?.uid)
            throw new HttpsError("unauthenticated", "Sign in to save a copy.");
        limitRequests();
        return saveAsFile(getFirestore(), auth.uid, data);
    }
);
