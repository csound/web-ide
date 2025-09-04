import { collection, doc, onSnapshot } from "firebase/firestore";
import { store, RootState, AppThunkDispatch } from "@root/store";
import { CsoundObj } from "@csound/browser";
import { projects, targets } from "@config/firestore";
import { IDocument } from "./types";
import {
    addDocumentToCsoundFS,
    convertDocumentSnapToDocumentsMap,
    fileDocumentDataToDocumentType
} from "./utils";
import {
    addProjectDocuments,
    removeDocumentLocally,
    saveUpdatedDocument
} from "./actions";
import { tabClose } from "@comp/project-editor/actions";
import { updateAllTargetsLocally } from "@comp/target-controls/actions";
import { append, concat, forEach, isEmpty, path, values } from "ramda";
import { IFirestoreDocument } from "@root/db/types";

export const subscribeToProjectFilesChanges = (
    projectUid: string,
    dispatch: AppThunkDispatch
) => {
    if (!projectUid) {
        console.warn(
            "No projectUid provided to subscribeToProjectFilesChanges"
        );
        return () => {}; // Return empty unsubscribe function
    }

    try {
        const unsubscribe: () => void = onSnapshot(
            collection(doc(projects, projectUid), "files"),
            async (files) => {
                const changedFiles = files.docChanges();
                const filesToAdd = changedFiles.filter(
                    (file) => file.type === "added"
                );
                const filesToRemove = changedFiles.filter(
                    (file) => file.type === "removed"
                );
                const filesToModify = changedFiles.filter(
                    (file) => file.type === "modified"
                );

                if (!isEmpty(filesToAdd)) {
                    const documents: Record<string, IDocument> =
                        convertDocumentSnapToDocumentsMap(filesToAdd);
                    await dispatch(addProjectDocuments(projectUid, documents));
                }

                if (!isEmpty(filesToModify)) {
                    const currentReduxDocuments =
                        store.getState()?.ProjectsReducer?.projects?.[
                            projectUid
                        ]?.documents || {};

                    const documentSnaps = filesToModify.map((file) => file.doc);

                    const documentData = documentSnaps.map((d) => {
                        const firestoreData = d.data() as IFirestoreDocument;
                        return fileDocumentDataToDocumentType(
                            firestoreData,
                            d.id
                        );
                    }) as IDocument[];

                    // when using serverData, we get 2 responses,
                    // since we always modify the lastModified timestamp,
                    // it will be null the first time and immedietly not-null
                    const documentDataReady = documentData.filter(
                        (d) => !!d.lastModified
                    );
                    documentDataReady.forEach(async (document_) => {
                        if (document_.type !== "folder") {
                            await dispatch(
                                saveUpdatedDocument(
                                    projectUid,
                                    document_
                                ) as any
                            );
                        }
                    });
                }
                if (!isEmpty(filesToRemove)) {
                    const currentReduxDocuments =
                        store.getState()?.ProjectsReducer?.projects?.[
                            projectUid
                        ]?.documents || {};

                    const documentSnaps = filesToRemove.map((file) => file.doc);

                    const documentData = documentSnaps.map((d) => {
                        const firestoreData = d.data() as IFirestoreDocument;
                        return fileDocumentDataToDocumentType(
                            firestoreData,
                            d.id
                        );
                    }) as IDocument[];

                    const uids = documentData.map((d) => d.documentUid);

                    for (const uid of uids) {
                        await dispatch(tabClose(projectUid, uid, false) as any);
                        await dispatch(
                            removeDocumentLocally(projectUid, uid) as any
                        );
                    }
                }
            },
            (error: any) => {
                console.error("Error in project files subscription:", error);
            }
        );
        return unsubscribe;
    } catch (error) {
        console.error("Error setting up project files subscription:", error);
        return () => {}; // Return empty unsubscribe function
    }
};

export const subscribeToProjectTargetsChanges = (
    projectUid: string,
    dispatch: (store: RootState) => void
): (() => void) => {
    if (!projectUid) {
        console.warn(
            "No projectUid provided to subscribeToProjectTargetsChanges"
        );
        return () => {}; // Return empty unsubscribe function
    }

    try {
        const unsubscribe: () => void = onSnapshot(
            doc(targets, projectUid),
            async (target) => {
                if (!target.exists()) {
                    return;
                }
                const { defaultTarget, targets } = target.data();
                updateAllTargetsLocally(
                    dispatch,
                    defaultTarget,
                    projectUid,
                    targets
                );
            },
            (error: any) =>
                console.error("Error in project targets subscription:", error)
        );
        return unsubscribe;
    } catch (error) {
        console.error("Error setting up project targets subscription:", error);
        return () => {}; // Return empty unsubscribe function
    }
};

export const subscribeToProjectChanges = (
    projectUid: string,
    dispatch: AppThunkDispatch
): (() => void) => {
    const unsubscribeFileChanges = subscribeToProjectFilesChanges(
        projectUid,
        dispatch
    );
    const unsubscribeTargetChanges = subscribeToProjectTargetsChanges(
        projectUid,
        dispatch
    );
    const unsubscribe = () =>
        [unsubscribeFileChanges, unsubscribeTargetChanges].forEach((u) => u());
    return unsubscribe;
};
