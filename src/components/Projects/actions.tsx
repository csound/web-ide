import { push } from "connected-react-router";
import { ICsoundObj } from "@comp/Csound/types";
import { tabOpenByDocumentUid, tabDockInit } from "@comp/ProjectEditor/actions";
import {
    addDocumentPrompt,
    deleteDocumentPrompt,
    newDocumentPrompt,
    newFolderPrompt
} from "./modals";
import {
    selectDefaultTargetName,
    selectTarget
} from "@comp/TargetControls/selectors";
import { selectLoggedInUid } from "@comp/Login/selectors";
import { updateProjectLastModified } from "@comp/ProjectLastModified/actions";
import { selectTabDockIndex } from "@comp/ProjectEditor/selectors";
import { closeModal, openSimpleModal } from "../Modal/actions";
import { openSnackbar } from "@comp/Snackbar/actions";
import { SnackbarType } from "@comp/Snackbar/types";
import { filter as _filter, find, isEmpty } from "lodash";
import {
    append,
    assoc,
    concat,
    filter,
    map,
    path,
    pathOr,
    prop,
    reduce,
    values
} from "ramda";
import {
    ACTIVATE_PROJECT,
    ADD_PROJECT_DOCUMENTS,
    DOCUMENT_INITIALIZE,
    DOCUMENT_RESET,
    DOCUMENT_RENAME_LOCALLY,
    DOCUMENT_REMOVE_LOCALLY,
    DOCUMENT_SAVE,
    DOCUMENT_UPDATE_VALUE,
    DOCUMENT_UPDATE_MODIFIED_LOCALLY,
    CLOSE_PROJECT,
    SET_PROJECT_PUBLIC,
    STORE_PROJECT_LOCALLY,
    UNSET_PROJECT,
    IProject,
    IDocument,
    IDocumentsMap
} from "./types";
import { ITarget } from "@comp/TargetControls/types";
import {
    addDocumentToEMFS,
    convertProjectSnapToProject,
    fileDocDataToDocumentType,
    textOrBinary
} from "./utils";
import { IStore } from "@store/types";
import {
    db,
    getFirebaseTimestamp,
    projects,
    storageRef
} from "@config/firestore";
import { store } from "@root/store";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import firebase from "firebase/app";
import uuidv4 from "uuid/v4";
import { selectActiveProjectUid } from "../SocialControls/selectors";
import { Action } from "redux";
import { ThunkAction } from "redux-thunk";

export const downloadProjectOnce = (projectUid: string) => {
    return async (dispatch: any) => {
        const projRef = projects.doc(projectUid);
        const projSnap = await projRef.get();
        if (projSnap && projSnap.exists) {
            const project: IProject = await convertProjectSnapToProject(
                projSnap
            );
            await dispatch(storeProjectLocally(project));
        }
    };
};

// TODO: optimize
export const downloadAllProjectDocumentsOnce = (
    projectUid: string,
    csound: ICsoundObj
) => {
    return async (dispatch: any) => {
        const filesRef = await projects
            .doc(projectUid)
            .collection("files")
            .get();
        const allDocuments = await Promise.all(
            filesRef.docs.map(async d => {
                const data = await d.data();
                return fileDocDataToDocumentType(
                    assoc("documentUid", d.id, data)
                );
            })
        );
        const allDocsMap = reduce(
            (acc, doc) => assoc(doc.documentUid, doc, acc),
            {},
            allDocuments
        );

        await allDocuments.forEach(async doc => {
            if (doc.type !== "folder") {
                const pathPrefix = (doc.path || [])
                    .filter(p => typeof p === "string")
                    .map(docUid => path([docUid, "filename"], allDocsMap));
                const absolutePath = concat(
                    [`/${projectUid}`],
                    append(doc.filename, pathPrefix)
                ).join("/");
                await addDocumentToEMFS(projectUid, csound, doc, absolutePath);
            }
        });

        await dispatch({
            type: ADD_PROJECT_DOCUMENTS,
            projectUid,
            documents: allDocsMap
        });
    };
};

export const newEmptyDocumentAction = (
    projectUid: string,
    documentUid: string,
    filename: string
) => ({
    type: DOCUMENT_INITIALIZE,
    filename,
    documentUid,
    projectUid
});

export const closeProject = () => {
    return {
        type: CLOSE_PROJECT
    };
};

export const activateProject = (projectUid: string, csound) => {
    return async (dispatch: any) => {
        dispatch({
            type: ACTIVATE_PROJECT,
            projectUid
        });
    };
};

export const storeProjectLocally = (project: IProject) => {
    return {
        type: STORE_PROJECT_LOCALLY,
        project
    };
};

export const unsetProject = (projectUid: string) => {
    return {
        type: UNSET_PROJECT,
        projectUid
    };
};

export const addProjectDocuments = (
    projectUid: string,
    documents: IDocumentsMap
) => {
    return async (dispatch: any, getState) => {
        const store: IStore = getState();
        const tabIndex: number = selectTabDockIndex(store);
        await dispatch({
            type: ADD_PROJECT_DOCUMENTS,
            projectUid,
            documents
        });
        if (tabIndex < 0) {
            const maybeDefaultTargetName:
                | string
                | null = selectDefaultTargetName(projectUid, store);
            const maybeDefaultTarget: ITarget | null = maybeDefaultTargetName
                ? selectTarget(projectUid, maybeDefaultTargetName, store)
                : null;
            dispatch(
                tabDockInit(projectUid, values(documents), maybeDefaultTarget)
            );
        }
    };
};

export const resetDocumentValue = (projectUid: string, documentUid: string) => {
    return {
        type: DOCUMENT_RESET,
        projectUid,
        documentUid
    };
};

export const saveFile = () => {
    return async (dispatch: any) => {
        const state = store.getState() as IStore;
        const dock = state.ProjectEditorReducer.tabDock;
        const activeTab = dock.openDocuments[dock.tabIndex];
        const docUid = activeTab.uid;
        const activeProjectUid = pathOr(
            "",
            ["ProjectsReducer", "activeProjectUid"],
            state
        );
        const project: IProject = pathOr(
            {} as IProject,
            ["ProjectsReducer", "projects", activeProjectUid],
            state
        );
        const doc =
            project && find(project.documents, d => d.documentUid === docUid);
        if (project && doc) {
            try {
                projects
                    .doc(project.projectUid)
                    .collection("files")
                    .doc(doc.documentUid)
                    .update({
                        value: doc.currentValue,
                        lastModified: getFirebaseTimestamp()
                    });
                updateProjectLastModified(project.projectUid);
            } catch (error) {}
        }
    };
};

export const saveAllFiles = () => {
    return async (dispatch: any) => {
        const state = store.getState() as IStore;
        const activeProjectUid = pathOr(
            "",
            ["ProjectsReducer", "activeProjectUid"],
            state
        );
        const project: IProject = pathOr(
            {} as IProject,
            ["ProjectsReducer", "projects", activeProjectUid],
            state
        );
        const docs =
            project &&
            _filter(
                Object.values(project.documents),
                d => d.isModifiedLocally === true
            );
        if (project && !isEmpty(docs)) {
            const batch = db.batch();
            docs!.forEach(doc => {
                batch.update(
                    projects
                        .doc(project.projectUid)
                        .collection("files")
                        .doc(doc.documentUid),
                    {
                        value: doc.currentValue,
                        lastModified: getFirebaseTimestamp()
                    }
                );
            });
            batch.commit();
            updateProjectLastModified(project.projectUid);
        }
    };
};

export const saveAllAndClose = (goTo: string) => {
    return function(dispatch) {
        return saveAllFiles()(dispatch).then(
            () => dispatch(push(goTo)),
            console.error
        );
    };
};

export const deleteFile = (projectUid: string, documentUid: string) => {
    return async (dispatch: any, getState) => {
        const state = getState() as IStore;
        const project: IProject = pathOr(
            {} as IProject,
            ["ProjectsReducer", "projects", projectUid],
            state
        );
        if (project) {
            const doc = project.documents[documentUid];
            if (doc && doc.type === "folder") {
                const cancelCallback = () => dispatch(closeModal());
                const allNestedFiles = filter(
                    d => (d.path || []).includes(documentUid),
                    project.documents
                );
                const allNestedFilenames = map(
                    prop("filename"),
                    values(allNestedFiles)
                );
                const deleteCallback = () => {
                    const allFilesToDelete = append(
                        doc,
                        values(allNestedFiles)
                    );
                    const batch = db.batch();
                    allFilesToDelete.forEach(doc => {
                        batch.delete(
                            projects
                                .doc(project.projectUid)
                                .collection("files")
                                .doc(doc.documentUid)
                        );
                    });
                    batch.commit().then(() => {
                        dispatch(closeModal());
                        updateProjectLastModified(projectUid);
                    });
                };
                const deleteDocumentPromptComp = deleteDocumentPrompt(
                    doc.filename,
                    true,
                    allNestedFilenames,
                    cancelCallback,
                    deleteCallback
                );
                dispatch(openSimpleModal(deleteDocumentPromptComp));
            } else if (doc) {
                const cancelCallback = () => dispatch(closeModal());
                const deleteCallback = () => {
                    projects
                        .doc(projectUid)
                        .collection("files")
                        .doc(documentUid)
                        .delete()
                        .then(() => {
                            dispatch(closeModal());
                        });
                    updateProjectLastModified(projectUid);
                };
                const deleteDocumentPromptComp = deleteDocumentPrompt(
                    doc.filename,
                    false,
                    [],
                    cancelCallback,
                    deleteCallback
                );

                dispatch(openSimpleModal(deleteDocumentPromptComp));
            } else {
                console.error("No document found with id", projectUid);
            }
        } else {
            console.error("No project found with id", projectUid);
        }
    };
};

export const saveUpdatedDocument = (
    projectUid: string,
    document: IDocument
) => ({
    type: DOCUMENT_SAVE,
    document,
    projectUid
});

export const updateDocumentValue = (
    val: string,
    projectUid: string,
    documentUid: string
) => {
    return async (dispatch: any) => {
        dispatch({
            type: DOCUMENT_UPDATE_VALUE,
            val,
            projectUid,
            documentUid
        });
    };
};

export const updateDocumentModifiedLocally = (
    isModified: boolean,
    projectUid: string,
    documentUid: string
) => {
    return async (dispatch: any) => {
        dispatch({
            type: DOCUMENT_UPDATE_MODIFIED_LOCALLY,
            isModified,
            documentUid,
            projectUid
        });
    };
};

export const newFolder = (projectUid: string) => {
    return async (dispatch: any, getState) => {
        const state = store.getState() as IStore;
        const project: IProject = pathOr(
            {} as IProject,
            ["ProjectsReducer", "projects", projectUid],
            state
        );
        const userUid: string = pathOr(
            {} as IProject,
            ["LoginReducer", "loggedInUid"],
            state
        );
        const newFolderSuccessCallback = async (filename: string) => {
            if (!isEmpty(project)) {
                const doc = {
                    type: "folder",
                    name: filename,
                    userUid,
                    path: [],
                    lastModified: getFirebaseTimestamp(),
                    createdAt: getFirebaseTimestamp()
                };
                await projects
                    .doc(projectUid)
                    .collection("files")
                    .add(doc);
                updateProjectLastModified(projectUid);
            }
            dispatch(closeModal());
        };
        const newFolderPromptComp = newFolderPrompt(
            newFolderSuccessCallback,
            project
        );
        dispatch(openSimpleModal(newFolderPromptComp));
    };
};

export const newDocument = (projectUid: string, val: string) => {
    return async (dispatch: any) => {
        const newDocumentSuccessCallback = async (filename: string) => {
            const state = store.getState() as IStore;
            const activeProjectUid = pathOr(
                "",
                ["ProjectsReducer", "activeProjectUid"],
                state
            );
            const project: IProject = pathOr(
                {} as IProject,
                ["ProjectsReducer", "projects", activeProjectUid],
                state
            );

            if (!isEmpty(project)) {
                const uid = firebase.auth().currentUser!.uid;
                const doc = {
                    type: "txt",
                    name: filename,
                    value: val,
                    userUid: uid,
                    lastModified: getFirebaseTimestamp(),
                    createdAt: getFirebaseTimestamp(),
                    path: []
                };
                const res = await projects
                    .doc(project.projectUid)
                    .collection("files")
                    .add(doc);

                const documentUid = res.id;
                dispatch(tabOpenByDocumentUid(res.id, projectUid));
                dispatch(
                    newEmptyDocumentAction(projectUid, documentUid, filename)
                );
                updateProjectLastModified(project.projectUid);
            }
            dispatch(closeModal());
        };
        const newDocumentPromptComp = newDocumentPrompt(
            newDocumentSuccessCallback,
            false,
            ""
        );
        dispatch(openSimpleModal(newDocumentPromptComp));
    };
};

export const addDocument = (projectUid: string) => {
    return async (dispatch: any) => {
        const addDocumentSuccessCallback = async (files: FileList) => {
            const state = store.getState() as IStore;
            const activeProjectUid = pathOr(
                "",
                ["ProjectsReducer", "activeProjectUid"],
                state
            );
            const project: IProject = pathOr(
                {} as IProject,
                ["ProjectsReducer", "projects", activeProjectUid],
                state
            );

            if (!isEmpty(project) && files && files.length > 0) {
                const file = files[0];
                const filename = file.name;
                const fileType = textOrBinary(file.name);
                const reader = new FileReader();
                const uid = firebase.auth().currentUser!.uid;

                console.log("File type found: ", fileType);

                if (fileType === "txt") {
                    reader.onload = e => {
                        let txt = reader.result;
                        const doc = {
                            type: fileType,
                            name: filename,
                            value: txt,
                            userUid: uid,
                            lastModified: getFirebaseTimestamp(),
                            createdAt: getFirebaseTimestamp()
                        };
                        projects
                            .doc(project.projectUid)
                            .collection("files")
                            .add(doc)
                            .then(res => {
                                const documentUid = res.id;
                                dispatch(
                                    tabOpenByDocumentUid(
                                        res.id,
                                        activeProjectUid
                                    )
                                );
                                dispatch(
                                    newEmptyDocumentAction(
                                        project.projectUid,
                                        documentUid,
                                        filename
                                    )
                                );
                            });
                        updateProjectLastModified(project.projectUid);
                    };
                    reader.readAsText(file);
                } else if (fileType === "bin") {
                    // generate UUID
                    const docId = uuidv4();

                    let metadata = {
                        customMetadata: {
                            filename,
                            projectUid,
                            userUid: uid,
                            docUid: docId
                        }
                    };

                    const uploadTask = storageRef
                        .child(`${uid}/${project.projectUid}/${docId}`)
                        .put(file, metadata);
                    // Listen for state changes, errors, and completion of the upload.
                    uploadTask.on(
                        firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
                        function(snapshot) {
                            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                            var progress =
                                (snapshot.bytesTransferred /
                                    snapshot.totalBytes) *
                                100;
                            console.log("Upload is " + progress + "% done");
                            switch (snapshot.state) {
                                case firebase.storage.TaskState.PAUSED: // or 'paused'
                                    console.log("Upload is paused");
                                    break;
                                case firebase.storage.TaskState.RUNNING: // or 'running'
                                    console.log("Upload is running");
                                    break;
                            }
                        },
                        function(error) {
                            dispatch(
                                openSnackbar(error.message, SnackbarType.Error)
                            );
                            // A full list of error codes is available at
                            // https://firebase.google.com/docs/storage/web/handle-errors
                            switch (error.name) {
                                case "storage/unauthorized":
                                    // User doesn't have permission to access the object
                                    break;

                                case "storage/canceled":
                                    // User canceled the upload
                                    break;

                                case "storage/unknown":
                                    // Unknown error occurred, inspect error.serverResponse
                                    break;
                            }
                        },
                        function() {
                            // Upload completed successfully, now we can get the download URL
                            // uploadTask.snapshot.ref.getDownloadURL()
                            // cloud function updates firestore for file entry
                        }
                    );
                }
            }
            dispatch(closeModal());
        };
        const addDocumentPromptComp = addDocumentPrompt(
            addDocumentSuccessCallback
        );
        dispatch(openSimpleModal(addDocumentPromptComp));
    };
};

const renameDocumentLocally = (documentUid: string, newFilename: string) => {
    return {
        type: DOCUMENT_RENAME_LOCALLY,
        newFilename,
        documentUid
    };
};

export const removeDocumentLocally = (
    projectUid: string,
    documentUid: string
) => {
    return {
        type: DOCUMENT_REMOVE_LOCALLY,
        projectUid,
        documentUid
    };
};

export const renameDocument = (projectUid: string, documentUid: string) => {
    return async (dispatch: any, getState) => {
        const state = getState() as IStore;
        const project: IProject = pathOr(
            {} as IProject,
            ["ProjectsReducer", "projects", projectUid],
            state
        );
        if (!project) {
            console.error("Project", projectUid, "was not found!");
            return;
        }
        const currentFilename = pathOr(
            "",
            ["documents", documentUid, "filename"],
            project
        );
        const renameDocumentSuccessCallback = async (filename: string) => {
            await projects
                .doc(projectUid)
                .collection("files")
                .doc(documentUid)
                .update({ name: filename } as any);

            dispatch(renameDocumentLocally(documentUid, filename));
            updateProjectLastModified(projectUid);
            dispatch(closeModal());
        };
        const renameDocumentPromptComp = newDocumentPrompt(
            renameDocumentSuccessCallback,
            true,
            currentFilename
        );
        dispatch(openSimpleModal(renameDocumentPromptComp));
    };
};

export const exportProject = () => {
    return async (dispatch: any) => {
        const state = store.getState() as IStore;
        const activeProjectUid = pathOr(
            "",
            ["ProjectsReducer", "activeProjectUid"],
            state
        );
        const project: IProject = pathOr(
            {} as IProject,
            ["ProjectsReducer", "projects", activeProjectUid],
            state
        );

        if (!isEmpty(project)) {
            // FIXME: does not handle binaries...
            const zip = new JSZip();
            const folder = zip.folder("project");
            const docs = Object.values(project.documents);

            for (let i = 0; i < docs.length; i++) {
                let doc = docs[i];
                if (doc.type === "bin") {
                    const path = `${project.userUid}/${project.projectUid}/${doc.documentUid}`;
                    const url = await storageRef.child(path).getDownloadURL();

                    const response = await fetch(url);
                    const blob = await response.arrayBuffer();
                    folder.file(doc.filename, blob, { binary: true });
                } else {
                    folder.file(doc.filename, doc.savedValue);
                }
            }

            zip.generateAsync({ type: "blob" }).then(content => {
                saveAs(content, "project.zip");
            });
        }
    };
};

export const markProjectPublic = (
    isPublic: boolean
): ThunkAction<void, any, null, Action<string>> => {
    return async (dispatch, getState) => {
        const state = getState();
        const activeProjectUid = selectActiveProjectUid(state);
        const loggedInUserUid = selectLoggedInUid(state);
        if (loggedInUserUid === null || activeProjectUid === null) {
            return;
        }
        await projects.doc(activeProjectUid).update({
            public: isPublic
        });
        dispatch({
            type: SET_PROJECT_PUBLIC,
            projectUid: activeProjectUid,
            isPublic
        });
        updateProjectLastModified(activeProjectUid);
    };
};
