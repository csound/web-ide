import { getAuth } from "firebase/auth";
import { addDoc, collection, doc, onSnapshot } from "firebase/firestore";
import { uploadBytesResumable } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import {
    getFirebaseTimestamp,
    projects,
    storageReference
} from "@config/firestore";
import type { IFirestoreDocument } from "@root/db/types";
import type { AppThunkDispatch, RootState } from "@root/store";
import { openSnackbar } from "@comp/snackbar/actions";
import { SnackbarType } from "@comp/snackbar/types";
import { updateProjectLastModified } from "@comp/project-last-modified/actions";
import {
    ADD_PROJECT_DOCUMENTS,
    type IDocument,
    type IDocumentFileType
} from "./types";
import {
    fileDocumentDataToDocumentType,
    getUniqueFilename,
    textOrBinary
} from "./utils";

// Keep the existing upload limit, in decimal bytes.
export const MAX_PROJECT_FILE_BYTES = 2_000_000;
export const PROJECT_FILE_SIZE_LABEL = "2 MB";

export interface FileUploadProgress {
    filename: string;
    index: number;
    total: number;
    percent: number;
}

const uploadingProjects = new Set<string>();

async function waitForUploadedDocument(
    projectUid: string,
    documentUid: string
) {
    let unsubscribe: (() => void) | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
        return await new Promise<IDocument>((resolve, reject) => {
            timeout = setTimeout(
                () => reject(new Error("Check the file tree again shortly.")),
                60_000
            );
            unsubscribe = onSnapshot(
                doc(projects, projectUid, "files", documentUid),
                { includeMetadataChanges: true },
                (snapshot) => {
                    if (
                        snapshot.exists() &&
                        !snapshot.metadata.fromCache &&
                        !snapshot.metadata.hasPendingWrites
                    ) {
                        resolve(
                            fileDocumentDataToDocumentType(
                                snapshot.data() as IFirestoreDocument,
                                snapshot.id
                            )
                        );
                    }
                },
                reject
            );
        });
    } finally {
        clearTimeout(timeout);
        unsubscribe?.();
    }
}

/** Both file picking and dropping go through this size and ownership check. */
export const uploadProjectFiles =
    (
        projectUid: string,
        files: File[],
        onProgress?: (progress: FileUploadProgress | undefined) => void,
        onUploaded?: (documentUid: string, type: IDocumentFileType) => void
    ) =>
    async (dispatch: AppThunkDispatch, getState: () => RootState) => {
        const uid = getAuth().currentUser?.uid;
        const project = getState().ProjectsReducer.projects[projectUid];
        if (!uid || !project || project.userUid !== uid) {
            dispatch(
                openSnackbar(
                    "Only the project owner can upload files.",
                    SnackbarType.Error
                )
            );
            return;
        }
        if (uploadingProjects.has(projectUid)) {
            dispatch(
                openSnackbar(
                    "Wait for the current upload to finish.",
                    SnackbarType.Info
                )
            );
            return;
        }
        uploadingProjects.add(projectUid);
        const names: string[] = [];
        let uploaded = 0;
        const failures: string[] = [];
        const warnings: string[] = [];
        try {
            for (const [index, file] of files.entries()) {
                if (file.size > MAX_PROJECT_FILE_BYTES) {
                    failures.push(
                        `${file.name}: exceeds ${PROJECT_FILE_SIZE_LABEL}.`
                    );
                    continue;
                }
                const currentNames = Object.values(
                    getState().ProjectsReducer.projects[projectUid]
                        ?.documents ?? {}
                )
                    .filter((document) => !document.path?.length)
                    .map((document) => document.filename);
                const filename = getUniqueFilename(file.name, [
                    ...names,
                    ...currentNames
                ]);
                const type = textOrBinary(filename);
                const progress = (percent: number) =>
                    onProgress?.({
                        filename,
                        index,
                        total: files.length,
                        percent
                    });
                try {
                    if (getAuth().currentUser?.uid !== uid)
                        throw new Error("Sign in again to upload files.");
                    progress(0);
                    let documentUid: string;
                    let value = "";
                    if (type === "txt") {
                        value = await file.text();
                        const saved = await addDoc(
                            collection(doc(projects, projectUid), "files"),
                            {
                                type,
                                name: filename,
                                value,
                                userUid: uid,
                                created: getFirebaseTimestamp(),
                                lastModified: getFirebaseTimestamp()
                            }
                        );
                        documentUid = saved.id;
                    } else {
                        documentUid = uuidv4();
                        const reference = await storageReference(
                            `${uid}/${projectUid}/${documentUid}`
                        );
                        const task = uploadBytesResumable(reference, file, {
                            cacheControl: "public,max-age=31536000,immutable",
                            customMetadata: {
                                filename,
                                projectUid,
                                userUid: uid,
                                docUid: documentUid
                            }
                        });
                        await new Promise<void>((resolve, reject) => {
                            task.on(
                                "state_changed",
                                (snapshot) => {
                                    progress(
                                        snapshot.totalBytes
                                            ? (snapshot.bytesTransferred /
                                                  snapshot.totalBytes) *
                                                  100
                                            : 100
                                    );
                                },
                                reject,
                                resolve
                            );
                        });
                    }
                    names.push(filename);
                    uploaded++;
                    let confirmedDocument: IDocument | undefined;
                    if (type === "bin") {
                        try {
                            // Storage completion does not mean the finalize trigger has created the file yet.
                            confirmedDocument = await waitForUploadedDocument(
                                projectUid,
                                documentUid
                            );
                        } catch (error) {
                            warnings.push(
                                `${filename}: uploaded, but not ready to use. ${error instanceof Error ? error.message : "It may appear shortly."}`
                            );
                            continue;
                        }
                    }
                    // Only expose editable rows after their Firestore records exist.
                    if (
                        !getState().ProjectsReducer.projects[projectUid]
                            ?.documents[documentUid]
                    )
                        dispatch({
                            type: ADD_PROJECT_DOCUMENTS,
                            projectUid,
                            documents: {
                                [documentUid]: confirmedDocument ?? {
                                    documentUid,
                                    filename,
                                    type,
                                    userUid: uid,
                                    path: [],
                                    currentValue: value,
                                    savedValue: value,
                                    isModifiedLocally: false,
                                    created: undefined,
                                    lastModified: undefined
                                }
                            }
                        });
                    progress(100);
                    onUploaded?.(documentUid, type);
                } catch (error) {
                    failures.push(
                        `${file.name}: ${error instanceof Error ? error.message : "Upload failed."}`
                    );
                }
            }
            if (uploaded) {
                try {
                    await updateProjectLastModified(projectUid);
                } catch {
                    warnings.push("The last-edited date could not be saved.");
                }
            }
            const summary = `${uploaded} ${uploaded === 1 ? "file" : "files"} uploaded.`;
            dispatch(
                openSnackbar(
                    [
                        summary,
                        ...(failures.length
                            ? [
                                  `${failures.length} skipped. ${failures.join(" ")}`
                              ]
                            : []),
                        ...warnings
                    ].join(" "),
                    failures.length || warnings.length
                        ? SnackbarType.Error
                        : SnackbarType.Info
                )
            );
        } finally {
            uploadingProjects.delete(projectUid);
            onProgress?.(undefined);
        }
    };
