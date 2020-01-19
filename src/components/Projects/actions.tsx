import React, { useState } from "react";
import { useSelector } from "react-redux";
import { push } from "connected-react-router";
import { tabOpenByDocumentUid, tabDockInit } from "@comp/ProjectEditor/actions";
import {
    selectDefaultTargetName,
    selectTarget
} from "@comp/TargetControls/selectors";
import { selectTabDockIndex } from "@comp/ProjectEditor/selectors";
import { closeModal, openSimpleModal } from "../Modal/actions";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import { filter, find, isEmpty, some } from "lodash";
import { pathOr, propOr, values } from "ramda";
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
    SET_PROJECT,
    SET_PROJECT_PUBLIC,
    ITarget,
    IProject,
    IDocument,
    IDocumentsMap
} from "./types";
import { textOrBinary } from "./utils";
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
import { formatFileSize } from "@root/utils";
import uuidv4 from "uuid/v4";
import * as SS from "./styles";
import { selectActiveProjectUid } from "../SocialControls/selectors";
import { Action } from "redux";
import { ThunkAction } from "redux-thunk";

export const initializeProject = (projectUid: string) => {
    return async (dispatch: any) => {
        const projRef = projects.doc(projectUid);
        const doc = await projRef.get();
        if (doc && doc.exists) {
            const data = doc.data();
            const project: IProject = {
                projectUid,
                documents: {},
                targets: propOr({}, "targets", data),
                defaultTarget: propOr(null, "defaultTarget", data),
                isPublic: propOr(false, "public", data),
                name: propOr("", "name", data),
                userUid: propOr("", "userUid", data),
                stars: propOr([], "stars", data)
            };
            await dispatch(setProject(project));
        }
    };
};

export const newEmptyDocument = (
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

export const activateProject = (projectUid: string) => {
    return async (dispatch: any) =>
        dispatch({
            type: ACTIVATE_PROJECT,
            projectUid
        });
};

export const setProject = (project: IProject) => {
    return {
        type: SET_PROJECT,
        project
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
                // dispatch(
                //     saveDocument(
                //         project.projectUid,
                //         doc.documentUid,
                //         doc.currentValue
                //     )
                // );
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
            filter(
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

const deleteDocumentPrompt = (
    filename: string,
    cancelCallback: () => void,
    deleteCallback: () => void
) => {
    return (() => {
        return (
            <div style={{ display: "flex", flexDirection: "column" }}>
                <h2>{"Confirm deletion of file: " + filename}</h2>
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => cancelCallback()}
                    style={{ marginTop: 12 }}
                >
                    Cancel
                </Button>
                <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => deleteCallback()}
                    style={{ marginTop: 12 }}
                >
                    Delete
                </Button>
            </div>
        );
    }) as React.FC;
};

export const deleteFile = (documentUid: string) => {
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

        if (!!project) {
            const doc = find(
                project.documents,
                d => d.documentUid === documentUid
            );

            if (doc) {
                const cancelCallback = () => dispatch(closeModal());
                const deleteCallback = () => {
                    projects
                        .doc(project.projectUid)
                        .collection("files")
                        .doc(doc.documentUid)
                        .delete()
                        .then(res => {
                            dispatch(closeModal());
                        });
                };
                const deleteDocumentPromptComp = deleteDocumentPrompt(
                    doc.filename,
                    cancelCallback,
                    deleteCallback
                );

                dispatch(openSimpleModal(deleteDocumentPromptComp));
            }
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

const newDocumentPrompt = (
    callback: (fileName: string) => void,
    renameAction: boolean,
    initFilename: string
) => {
    return (() => {
        const [input, setInput] = useState(renameAction ? initFilename : "");
        const [nameCollides, setNameCollides] = useState(false);

        const activeProjectUid = useSelector(
            pathOr("", ["ProjectsReducer", "activeProjectUid"])
        );
        const project: IProject = useSelector(
            pathOr({} as IProject, [
                "ProjectsReducer",
                "projects",
                activeProjectUid
            ])
        );

        const reservedFilenames = project.documents
            ? (values(project.documents) as IDocument[]).map(
                  doc => doc.filename
              )
            : [];

        const shouldDisable = isEmpty(input);
        return (
            <div style={{ display: "flex", flexDirection: "column" }}>
                <TextField
                    label={
                        nameCollides
                            ? input + " already exists!"
                            : "New filename"
                    }
                    onKeyDown={evt =>
                        evt.key === "Enter" && !shouldDisable && callback(input)
                    }
                    error={nameCollides}
                    value={input}
                    onChange={e => {
                        setInput(e.target.value);
                        setNameCollides(
                            some(reservedFilenames, fn => fn === e.target.value)
                        );
                    }}
                />
                <Button
                    css={SS.modalSubmitButton}
                    variant="outlined"
                    color={shouldDisable ? undefined : "primary"}
                    disabled={shouldDisable || nameCollides}
                    onClick={() => callback(input)}
                    style={{ marginTop: 11 }}
                >
                    {renameAction ? "Rename" : "Create"}
                </Button>
            </div>
        );
    }) as React.FC;
};

const addDocumentPrompt = (callback: (filelist: FileList) => void) => {
    return (() => {
        const [files, setFiles] = useState(null as FileList | null);
        const [nameCollides, setNameCollides] = useState(false);

        const activeProjectUid = useSelector(
            pathOr("", ["ProjectsReducer", "activeProjectUid"])
        );
        const project: IProject = useSelector(
            pathOr({} as IProject, [
                "ProjectsReducer",
                "projects",
                activeProjectUid
            ])
        );

        const reservedFilenames = (values(
            project.documents
        ) as IDocument[]).map(doc => doc.filename);

        const megabyte = Math.pow(10, 6);
        const shouldDisable =
            files == null || isEmpty(files) || files[0].size > megabyte;
        const filesize =
            files == null ? "Select file" : formatFileSize(files[0].size);
        return (
            <div style={{ display: "flex", flexDirection: "column" }}>
                <input
                    id="fileSelector"
                    type="file"
                    onChange={e => {
                        let files = e.target.files;
                        let fileName = files ? files[0].name : "";
                        setFiles(files);
                        setNameCollides(
                            some(reservedFilenames, fn => fn === fileName)
                        );
                    }}
                ></input>
                <p>File Size: {filesize} (Max file size is 1MB)</p>
                <Button
                    variant="outlined"
                    color="primary"
                    disabled={shouldDisable || nameCollides}
                    onClick={() => callback(files!)}
                    style={{ marginTop: 11 }}
                >
                    Upload
                </Button>
            </div>
        );
    }) as React.FC;
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
                    createdAt: getFirebaseTimestamp()
                };
                const res = await projects
                    .doc(project.projectUid)
                    .collection("files")
                    .add(doc);

                const documentUid = res.id;
                dispatch(tabOpenByDocumentUid(res.id, projectUid));
                dispatch(newEmptyDocument(projectUid, documentUid, filename));
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
                            userUid: uid
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
                                    newEmptyDocument(
                                        project.projectUid,
                                        documentUid,
                                        filename
                                    )
                                );
                            });
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

export const renameDocument = (
    documentUid: string,
    currentFilename: string
) => {
    return async (dispatch: any) => {
        const renameDocumentSuccessCallback = async (filename: string) => {
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
                projects
                    .doc(project.projectUid)
                    .collection("files")
                    .doc(documentUid)
                    .update({ name: filename } as any)
                    .then(res => {
                        dispatch(renameDocumentLocally(documentUid, filename));
                    });
            }
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
    return (dispatch, getState) => {
        console.log("setting project to " + isPublic);
        const state = getState();
        const activeProjectUid = selectActiveProjectUid(state);
        if (activeProjectUid == null) {
            return;
        }
        firebase.auth().onAuthStateChanged(async user => {
            if (user !== null) {
                await projects.doc(activeProjectUid).update({
                    public: isPublic
                });
                dispatch({
                    type: SET_PROJECT_PUBLIC,
                    projectUid: activeProjectUid,
                    isPublic
                });
            }
        });
    };
};
