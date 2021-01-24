import { IDocument, IDocumentsMap } from "./types";
import { store } from "@store/index";
import { CsoundObj } from "@csound/browser";
import { projects, targets } from "@config/firestore";
import {
    addDocumentToEMFS,
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
import {
    append,
    assoc,
    concat,
    filter,
    forEach,
    map,
    isEmpty,
    path,
    prop,
    propEq,
    values
} from "ramda";

export const subscribeToProjectFilesChanges = (
    projectUid: string,
    dispatch: (any) => void,
    csound: CsoundObj
): (() => void) => {
    const unsubscribe: () => void = projects
        .doc(projectUid)
        .collection("files")
        .onSnapshot(async (files) => {
            const changedFiles = files.docChanges();
            const filesToAdd = filter(propEq("type", "added"), changedFiles);
            const filesToRemove = filter(
                propEq("type", "removed"),
                changedFiles
            );
            const filesToModify = filter(
                propEq("type", "modified"),
                changedFiles
            );

            if (!isEmpty(filesToAdd)) {
                const documents: IDocumentsMap = convertDocumentSnapToDocumentsMap(
                    filesToAdd
                );
                forEach((d) => {
                    if (d.type !== "folder") {
                        const pathPrefix = (d.path || [])
                            .filter((p) => typeof p === "string")
                            .map((documentUid) =>
                                path([documentUid, "filename"], documents)
                            );
                        const absolutePath = concat(
                            [`/${projectUid}`],
                            append(d.filename, pathPrefix)
                        ).join("/");
                        addDocumentToEMFS(projectUid, csound, d, absolutePath);
                    }
                }, values(documents));
                dispatch(addProjectDocuments(projectUid, documents));
            }

            if (!isEmpty(filesToModify)) {
                const currentReduxDocuments = path(
                    ["ProjectsReducer", "projects", projectUid, "documents"],
                    store.getState()
                );
                const documentSnaps = map(prop("doc"), filesToModify);
                const documentData = map(
                    (d) =>
                        fileDocumentDataToDocumentType(
                            assoc("documentUid", d.id, d.data())
                        ),
                    documentSnaps
                ) as IDocument[];

                // when using serverData, we get 2 responses,
                // since we always modify the lastModified timestamp,
                // it will be null the first time and immedietly not-null
                const documentDataReady = documentData.filter(
                    (d) => !!d.lastModified
                );
                documentDataReady.forEach((document_) => {
                    if (document_.type !== "folder") {
                        const oldFile =
                            currentReduxDocuments[document_.documentUid];
                        const lastPathPrefix = (oldFile.path || [])
                            .filter((p) => typeof p === "string")
                            .map((documentUid) =>
                                path(
                                    [documentUid, "filename"],
                                    currentReduxDocuments
                                )
                            );
                        const lastAbsolutePath = concat(
                            [`/${projectUid}`],
                            append(oldFile.filename, lastPathPrefix)
                        ).join("/");
                        const newPathPrefix = (document_.path || [])
                            .filter((p) => typeof p === "string")
                            .map((documentUid) =>
                                path(
                                    [documentUid, "filename"],
                                    currentReduxDocuments
                                )
                            );
                        const newAbsolutePath = concat(
                            [`/${projectUid}`],
                            append(document_.filename, newPathPrefix)
                        ).join("/");
                        // Handle file moved
                        if (newAbsolutePath !== lastAbsolutePath) {
                            csound.unlinkFromFS(lastAbsolutePath);
                        } else {
                            csound.unlinkFromFS(newAbsolutePath);
                        }
                        addDocumentToEMFS(
                            projectUid,
                            csound,
                            document_,
                            newAbsolutePath
                        );
                        dispatch(saveUpdatedDocument(projectUid, document_));
                    }
                });
            }
            if (!isEmpty(filesToRemove)) {
                const currentReduxDocuments = path(
                    ["ProjectsReducer", "projects", projectUid, "documents"],
                    store.getState()
                );
                const documentSnaps = map(prop("doc"), filesToRemove);
                const documentData = map(
                    (d) =>
                        fileDocumentDataToDocumentType(
                            assoc("documentUid", d.id, d.data())
                        ),
                    documentSnaps
                ) as IDocument[];
                const uids = map(prop("documentUid"), documentData);
                uids.forEach((uid) => {
                    dispatch(tabClose(projectUid, uid, false));
                    dispatch(removeDocumentLocally(projectUid, uid));
                });

                documentData.forEach((document_) => {
                    if (document_.type !== "folder") {
                        const pathPrefix = (document_.path || [])
                            .filter((p) => typeof p === "string")
                            .map((documentUid) =>
                                path(
                                    [documentUid, "filename"],
                                    currentReduxDocuments
                                )
                            );
                        const absolutePath = concat(
                            [`/${projectUid}`],
                            append(document_.filename, pathPrefix)
                        ).join("/");
                        csound.unlinkFromFS(absolutePath);
                    }
                });
            }
        });
    return unsubscribe;
};

export const subscribeToProjectTargetsChanges = (
    projectUid: string,
    dispatch: (any) => void
): (() => void) => {
    const unsubscribe: () => void = targets.doc(projectUid).onSnapshot(
        (target) => {
            if (!target.exists) {
                return;
            }
            const { defaultTarget, targets } = target.data() as any;
            updateAllTargetsLocally(
                dispatch,
                defaultTarget,
                projectUid,
                targets
            );
        },
        (error: any) => console.error(error)
    );
    return unsubscribe;
};

export const subscribeToProjectChanges = (
    projectUid: string,
    dispatch: (any) => void,
    csound: CsoundObj
): (() => void) => {
    const unsubscribeFileChanges = subscribeToProjectFilesChanges(
        projectUid,
        dispatch,
        csound
    );
    const unsubscribeTargetChanges = subscribeToProjectTargetsChanges(
        projectUid,
        dispatch
    );
    const unsubscribe = () =>
        [unsubscribeFileChanges, unsubscribeTargetChanges].forEach((u) => u());
    return unsubscribe;
};
