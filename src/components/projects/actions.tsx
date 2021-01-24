import firebase from "firebase/app";
import "firebase/auth";
import { push } from "connected-react-router";
import { ICsoundObject } from "@comp/csound/types";
import {
    tabOpenByDocumentUid,
    tabDockInit
} from "@comp/project-editor/actions";
import {
    addDocumentPrompt,
    deleteDocumentPrompt,
    newDocumentPrompt,
    newFolderPrompt
} from "./modals";
import {
    selectDefaultTargetName,
    selectTarget
} from "@comp/target-controls/selectors";
import { selectLoggedInUid } from "@comp/login/selectors";
import { updateProjectLastModified } from "@comp/project-last-modified/actions";
import { selectTabDockIndex } from "@comp/project-editor/selectors";
import { closeModal, openSimpleModal } from "../modal/actions";
import { openSnackbar } from "@comp/snackbar/actions";
import { SnackbarType } from "@comp/snackbar/types";
import { filter as _filter, find, isEmpty } from "lodash";
import {
    append,
    assoc,
    concat,
    filter,
    forEach,
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
import { ITarget } from "@comp/target-controls/types";
import {
    addDocumentToEMFS,
    convertProjectSnapToProject,
    fileDocumentDataToDocumentType,
    textOrBinary
} from "./utils";
import { IStore } from "@store/types";
import {
    database,
    getFirebaseTimestamp,
    projects,
    storageReference
} from "@config/firestore";
import { store } from "@root/store";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { v4 as uuidv4 } from "uuid";
import { Action } from "redux";
import { ThunkAction } from "redux-thunk";

export const downloadProjectOnce = (
    projectUid: string
): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        const projReference = projects.doc(projectUid);
        let projSnap;
        try {
            projSnap = await projReference.get();
        } catch {
            return;
        }
        if (projSnap && projSnap.exists) {
            const project: IProject = await convertProjectSnapToProject(
                projSnap
            );
            await dispatch(storeProjectLocally([project]));
        }
    };
};

// TODO: optimize
export const downloadAllProjectDocumentsOnce = (
    projectUid: string,
    csound: ICsoundObject
): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        const filesReference = await projects
            .doc(projectUid)
            .collection("files")
            .get();
        const allDocuments = await Promise.all(
            filesReference.docs.map(async (d) => {
                const data = await d.data();
                return fileDocumentDataToDocumentType(
                    assoc("documentUid", d.id, data)
                );
            })
        );
        const allDocumentsMap = reduce(
            (accumulator, document_) =>
                assoc(document_.documentUid, document_, accumulator),
            {},
            allDocuments
        );

        await allDocuments.forEach(async (document_) => {
            if (document_.type !== "folder") {
                const pathPrefix = (document_.path || [])
                    .filter((p) => typeof p === "string")
                    .map((documentUid) =>
                        path([documentUid, "filename"], allDocumentsMap)
                    );
                const absolutePath = concat(
                    [`/${projectUid}`],
                    append(document_.filename, pathPrefix)
                ).join("/");
                await addDocumentToEMFS(
                    projectUid,
                    csound,
                    document_,
                    absolutePath
                );
            }
        });

        await dispatch({
            type: ADD_PROJECT_DOCUMENTS,
            projectUid,
            documents: allDocumentsMap
        });
    };
};

export const newEmptyDocumentAction = (
    projectUid: string,
    documentUid: string,
    filename: string
): Record<string, any> => ({
    type: DOCUMENT_INITIALIZE,
    filename,
    documentUid,
    projectUid
});

export const closeProject = (): Record<string, any> => {
    return {
        type: CLOSE_PROJECT
    };
};

export const activateProject = (
    projectUid: string,
    csound: ICsoundObject
): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        dispatch({
            type: ACTIVATE_PROJECT,
            projectUid
        });
    };
};

export const storeProjectLocally = (
    projects: Array<IProject>
): Record<string, any> => {
    return {
        type: STORE_PROJECT_LOCALLY,
        projects
    };
};

export const unsetProject = (projectUid: string): Record<string, any> => {
    return {
        type: UNSET_PROJECT,
        projectUid
    };
};

export const addProjectDocuments = (
    projectUid: string,
    documents: IDocumentsMap
): ((dispatch: any, getState: () => IStore) => Promise<void>) => {
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
                | undefined = selectDefaultTargetName(projectUid, store);
            const maybeDefaultTarget: ITarget | undefined = selectTarget(
                projectUid,
                maybeDefaultTargetName,
                store
            );

            dispatch(
                tabDockInit(projectUid, values(documents), maybeDefaultTarget)
            );
        }
    };
};

export const resetDocumentValue = (
    projectUid: string,
    documentUid: string
): Record<string, any> => {
    return {
        type: DOCUMENT_RESET,
        projectUid,
        documentUid
    };
};

export const saveFile = (): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        const state = store.getState() as IStore;
        const dock = state.ProjectEditorReducer.tabDock;
        const activeTab = dock.openDocuments[dock.tabIndex];
        const documentUid = activeTab.uid;
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
        const document_ =
            project &&
            find(project.documents, (d) => d.documentUid === documentUid);
        if (project && document_) {
            try {
                projects
                    .doc(project.projectUid)
                    .collection("files")
                    .doc(document_.documentUid)
                    .update({
                        value: document_.currentValue,
                        lastModified: getFirebaseTimestamp()
                    });
                updateProjectLastModified(project.projectUid);
            } catch {}
        }
    };
};

export const saveAllFiles = (): ((dispatch: any) => Promise<void>) => {
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
        const documents =
            project &&
            _filter(
                Object.values(project.documents),
                (d) => d.isModifiedLocally
            );
        if (project && documents && !isEmpty(documents)) {
            const batch = database.batch();
            documents.forEach((document_) => {
                batch.update(
                    projects
                        .doc(project.projectUid)
                        .collection("files")
                        .doc(document_.documentUid),
                    {
                        value: document_.currentValue,
                        lastModified: getFirebaseTimestamp()
                    }
                );
            });
            batch.commit();
            updateProjectLastModified(project.projectUid);
        }
    };
};

export const saveAllAndClose = (
    goTo: string
): ((dispatch: any) => Promise<void>) => {
    return function (dispatch) {
        return saveAllFiles()(dispatch).then(
            () => dispatch(push(goTo)),
            console.error
        );
    };
};

// for unauthorized or offline playing
export const saveFileOffline = (
    csound: ICsoundObject,
    activeProjectUid: string,
    document: IDocument,
    newValue: string
): void => {
    const pathPrefix = document.path || [];
    const absolutePath = concat(
        [`/${activeProjectUid}`],
        append(document.filename, pathPrefix)
    ).join("/");
    addDocumentToEMFS(
        activeProjectUid,
        csound,
        assoc("savedValue", newValue, document),
        absolutePath
    );
};

// for unauthorized or offline playing
export const saveAllOffline = (csound: ICsoundObject): void => {
    const state = store.getState() as IStore;
    const activeProjectUid = pathOr(
        "",
        ["ProjectsReducer", "activeProjectUid"],
        state
    );
    const project: IProject | undefined = path(
        ["ProjectsReducer", "projects", activeProjectUid],
        state
    );
    if (project) {
        const documents: IDocument[] = Object.values(project.documents);
        forEach((document: IDocument) => {
            const pathPrefix = document.path || [];
            const absolutePath = concat(
                [`/${activeProjectUid}`],
                append(document.filename, pathPrefix)
            ).join("/");
            addDocumentToEMFS(
                activeProjectUid,
                csound,
                assoc("savedValue", document.currentValue, document),
                absolutePath
            );
        }, documents);
    }
};

export const deleteFile = (
    projectUid: string,
    documentUid: string
): ((dispatch: any, getState: () => IStore) => Promise<void>) => {
    return async (dispatch: any, getState) => {
        const state = getState() as IStore;
        const project: IProject = pathOr(
            {} as IProject,
            ["ProjectsReducer", "projects", projectUid],
            state
        );
        if (project) {
            const document_ = project.documents[documentUid];
            if (document_ && document_.type === "folder") {
                const cancelCallback = () => dispatch(closeModal());
                const allNestedFiles = filter(
                    (d) => (d.path || []).includes(documentUid),
                    project.documents
                );
                const allNestedFilenames = map(
                    prop("filename"),
                    values(allNestedFiles)
                );
                const deleteCallback = () => {
                    const allFilesToDelete = append(
                        document_,
                        values(allNestedFiles)
                    );
                    const batch = database.batch();
                    allFilesToDelete.forEach((document__) => {
                        batch.delete(
                            projects
                                .doc(project.projectUid)
                                .collection("files")
                                .doc(document__.documentUid)
                        );
                    });
                    batch.commit().then(() => {
                        dispatch(closeModal());
                        updateProjectLastModified(projectUid);
                    });
                };
                const deleteDocumentPromptComp = deleteDocumentPrompt(
                    document_.filename,
                    true,
                    allNestedFilenames,
                    cancelCallback,
                    deleteCallback
                );
                dispatch(openSimpleModal(deleteDocumentPromptComp));
            } else if (document_) {
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
                    document_.filename,
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
): Record<string, any> => ({
    type: DOCUMENT_SAVE,
    document,
    projectUid
});

export const updateDocumentValue = (
    value: string,
    projectUid: string,
    documentUid: string
): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        dispatch({
            type: DOCUMENT_UPDATE_VALUE,
            val: value,
            projectUid,
            documentUid
        });
    };
};

export const updateDocumentModifiedLocally = (
    isModified: boolean,
    projectUid: string,
    documentUid: string
): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        dispatch({
            type: DOCUMENT_UPDATE_MODIFIED_LOCALLY,
            isModified,
            documentUid,
            projectUid
        });
    };
};

export const newFolder = (
    projectUid: string
): ((dispatch: any, getState: () => IStore) => Promise<void>) => {
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
                const document_ = {
                    type: "folder",
                    name: filename,
                    userUid,
                    path: [],
                    lastModified: getFirebaseTimestamp(),
                    created: getFirebaseTimestamp()
                };
                await projects
                    .doc(projectUid)
                    .collection("files")
                    .add(document_);
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

export const newDocument = (
    projectUid: string,
    value: string
): ((dispatch: any) => Promise<void>) => {
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
                const currentUser = firebase.auth().currentUser;
                const uid = currentUser ? currentUser.uid : "";
                const document_ = {
                    type: "txt",
                    name: filename,
                    value: value,
                    userUid: uid,
                    lastModified: getFirebaseTimestamp(),
                    created: getFirebaseTimestamp(),
                    path: []
                };
                const result = await projects
                    .doc(project.projectUid)
                    .collection("files")
                    .add(document_);

                const documentUid = result.id;
                dispatch(tabOpenByDocumentUid(result.id, projectUid));
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

export const addDocument = (
    projectUid: string
): ((dispatch: any) => Promise<void>) => {
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
                const currentUser = firebase.auth().currentUser;
                const uid = currentUser ? currentUser.uid : "";

                console.log("File type found:", fileType);

                if (fileType === "txt") {
                    reader.addEventListener("load", () => {
                        const txt = reader.result;
                        const document_ = {
                            type: fileType,
                            name: filename,
                            value: txt,
                            userUid: uid,
                            lastModified: getFirebaseTimestamp(),
                            created: getFirebaseTimestamp()
                        };
                        projects
                            .doc(project.projectUid)
                            .collection("files")
                            .add(document_)
                            .then((result) => {
                                const documentUid = result.id;
                                dispatch(
                                    tabOpenByDocumentUid(
                                        result.id,
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
                    });
                    reader.readAsText(file);
                } else if (fileType === "bin") {
                    // generate UUID
                    const documentId = uuidv4();

                    const metadata = {
                        customMetadata: {
                            filename,
                            projectUid,
                            userUid: uid,
                            docUid: documentId
                        }
                    };

                    const uploadTask = storageReference
                        .child(`${uid}/${project.projectUid}/${documentId}`)
                        .put(file, metadata);
                    // Listen for state changes, errors, and completion of the upload.
                    uploadTask.on(
                        firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
                        (snapshot) => {
                            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                            const progress =
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
                        function (error) {
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
                        function () {
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

const renameDocumentLocally = (
    documentUid: string,
    newFilename: string
): Record<string, any> => {
    return {
        type: DOCUMENT_RENAME_LOCALLY,
        newFilename,
        documentUid
    };
};

export const removeDocumentLocally = (
    projectUid: string,
    documentUid: string
): Record<string, any> => {
    return {
        type: DOCUMENT_REMOVE_LOCALLY,
        projectUid,
        documentUid
    };
};

export const renameDocument = (
    projectUid: string,
    documentUid: string
): ((dispatch: any, getState: () => IStore) => Promise<void>) => {
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

const createExportPath = (folders, document_): string => {
    if (!folders || pathOr([], ["path"], document_).length === 0) {
        return document_.filename;
    }
    const paths = document_.path.map((d) => folders[d].filename);
    return `${paths.join("/")}/${document_.filename}`;
};

export const exportProject = (): ((dispatch: any) => Promise<void>) => {
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
            const zip = new JSZip();
            const folder = zip.folder("project") as any;
            const documents = Object.values(project.documents);

            const folders = documents
                .filter((d) => d.type === "folder")
                .reduce((m, f) => {
                    return { ...m, [f.documentUid]: f };
                }, {});

            if (!folders) {
                console.error(`No folders found.`);
                return;
            }
            for (const document_ of documents) {
                if (document_.type === "bin") {
                    const path = `${project.userUid}/${project.projectUid}/${document_.documentUid}`;
                    const url = await storageReference
                        .child(path)
                        .getDownloadURL();

                    const response = await fetch(url);
                    const blob = await response.arrayBuffer();
                    const exportPath = createExportPath(folders, document_);
                    if (exportPath && folder && folder.file) {
                        folder.file(exportPath, blob, { binary: true });
                    } else {
                        console.error(`whoops, no export path was created`);
                    }
                } else if (document_.type === "txt") {
                    const exportPath = createExportPath(folders, document_);
                    folder.file(exportPath, document_.savedValue);
                }
            }

            zip.generateAsync({ type: "blob" }).then((content) => {
                saveAs(content, "project.zip");
            });
        }
    };
};

export const markProjectPublic = (
    projectUid: string,
    isPublic: boolean
): ThunkAction<void, any, null, Action<string>> => {
    return async (dispatch, getState) => {
        const state = getState();
        const loggedInUserUid = selectLoggedInUid(state);
        if (!loggedInUserUid || !projectUid) {
            return;
        }
        await projects.doc(projectUid).update({
            public: isPublic
        });
        dispatch({
            type: SET_PROJECT_PUBLIC,
            projectUid,
            isPublic
        });
        updateProjectLastModified(projectUid);
    };
};
