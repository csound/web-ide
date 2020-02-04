import { IDocument, IDocumentsMap } from "./types";
import { store } from "@store/index";
import { ICsoundObj } from "@comp/Csound/types";
import { projects, targets } from "@config/firestore";
import {
    addDocumentToEMFS,
    convertDocSnapToDocumentsMap,
    fileDocDataToDocumentType
} from "./utils";
import {
    addProjectDocuments,
    removeDocumentLocally,
    saveUpdatedDocument
} from "./actions";
import { tabClose } from "@comp/ProjectEditor/actions";
import { updateAllTargetsLocally } from "@comp/TargetControls/actions";
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
    dispatch: any,
    csound: ICsoundObj
) => {
    const unsubscribe: () => void = projects
        .doc(projectUid)
        .collection("files")
        .onSnapshot(async files => {
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
                const docs: IDocumentsMap = convertDocSnapToDocumentsMap(
                    filesToAdd
                );
                forEach(d => {
                    if (d.type !== "folder") {
                        const pathPrefix = (d.path || [])
                            .filter(p => typeof p === "string")
                            .map(docUid => path([docUid, "filename"], docs));
                        const absolutePath = concat(
                            [`/${projectUid}`],
                            append(d.filename, pathPrefix)
                        ).join("/");
                        addDocumentToEMFS(projectUid, csound, d, absolutePath);
                    }
                }, values(docs));
                dispatch(addProjectDocuments(projectUid, docs));
            }

            if (!isEmpty(filesToModify)) {
                const currentReduxDocuments = path(
                    ["ProjectsReducer", "projects", projectUid, "documents"],
                    store.getState()
                );
                const docsSnaps = map(prop("doc"), filesToModify);
                const docData = map(
                    d =>
                        fileDocDataToDocumentType(
                            assoc("documentUid", d.id, d.data())
                        ),
                    docsSnaps
                ) as IDocument[];

                // when using serverData, we get 2 responses,
                // since we always modify the lastModified timestamp,
                // it will be null the first time and immedietly not-null
                const docDataReady = docData.filter(d => !!d.lastModified);
                docDataReady.forEach(doc => {
                    if (doc.type !== "folder") {
                        const oldFile = currentReduxDocuments[doc.documentUid];
                        const lastPathPrefix = (oldFile.path || [])
                            .filter(p => typeof p === "string")
                            .map(docUid =>
                                path(
                                    [docUid, "filename"],
                                    currentReduxDocuments
                                )
                            );
                        const lastAbsolutePath = concat(
                            [`/${projectUid}`],
                            append(oldFile.filename, lastPathPrefix)
                        ).join("/");
                        const newPathPrefix = (doc.path || [])
                            .filter(p => typeof p === "string")
                            .map(docUid =>
                                path(
                                    [docUid, "filename"],
                                    currentReduxDocuments
                                )
                            );
                        const newAbsolutePath = concat(
                            [`/${projectUid}`],
                            append(doc.filename, newPathPrefix)
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
                            doc,
                            newAbsolutePath
                        );
                        dispatch(saveUpdatedDocument(projectUid, doc));
                    }
                });
            }
            if (!isEmpty(filesToRemove)) {
                const currentReduxDocuments = path(
                    ["ProjectsReducer", "projects", projectUid, "documents"],
                    store.getState()
                );
                const docsSnaps = map(prop("doc"), filesToRemove);
                const docsData = map(
                    d =>
                        fileDocDataToDocumentType(
                            assoc("documentUid", d.id, d.data())
                        ),
                    docsSnaps
                ) as IDocument[];
                const uids = map(prop("documentUid"), docsData);
                uids.forEach(uid => {
                    dispatch(tabClose(projectUid, uid, false));
                    dispatch(removeDocumentLocally(projectUid, uid));
                });

                docsData.forEach(doc => {
                    if (doc.type !== "folder") {
                        const pathPrefix = (doc.path || [])
                            .filter(p => typeof p === "string")
                            .map(docUid =>
                                path(
                                    [docUid, "filename"],
                                    currentReduxDocuments
                                )
                            );
                        const absolutePath = concat(
                            [`/${projectUid}`],
                            append(doc.filename, pathPrefix)
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
    dispatch: any
) => {
    const unsubscribe: () => void = targets.doc(projectUid).onSnapshot(
        target => {
            if (!target.exists) return;
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
    dispatch: any,
    csound: ICsoundObj
) => {
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
        [unsubscribeFileChanges, unsubscribeTargetChanges].forEach(u => u());
    return unsubscribe;
};
