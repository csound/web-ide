import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
    initialTabOpenByDocumentUid,
    tabClose,
    tabInitSwitch,
    tabOpenByDocumentUid
} from "../ProjectEditor/actions";
import { closeModal, openSimpleModal } from "../Modal/actions";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import { filter, find, isEmpty, reduce, some } from "lodash";
import { propOr } from "ramda";
import {
    DOCUMENT_INITIALIZE,
    DOCUMENT_RESET,
    DOCUMENT_RENAME_LOCALLY,
    DOCUMENT_SAVE,
    DOCUMENT_UPDATE_VALUE,
    DOCUMENT_UPDATE_MODIFIED_LOCALLY,
    CLOSE_PROJECT,
    SET_PROJECT,
    IProject,
    IDocument
} from "./types";
import { textOrBinary } from "./utils";
import { IStore } from "../../db/interfaces";
import { projects, storageRef } from "../../config/firestore";
import { store } from "../../store";
import { ICsoundObj } from "../Csound/types";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import firebase from "firebase/app";
import { formatFileSize } from "../../utils";
import uuidv4 from "uuid/v4";
import { selectActiveProject } from "./selectors";

export const loadProjectFromFirestore = (projectUid: string) => {
    return async (dispatch: any) => {
        if (projectUid) {
            const projRef = projects.doc(projectUid);
            const doc = await projRef.get();
            if (doc) {
                const data = doc.data();
                // TODO - Sync files to Redux as well as EMFS
                projRef.collection("files").onSnapshot(files => {
                    const documents = reduce(
                        files.docs,
                        (acc, docSnapshot) => {
                            const docData = docSnapshot.data();
                            acc[docSnapshot.id] = {
                                currentValue: docData["value"],
                                documentUid: docSnapshot.id,
                                savedValue: docData["value"],
                                filename: docData["name"],
                                type: docData["type"],
                                isModifiedLocally: false
                            } as IDocument;
                            return acc;
                        },
                        {}
                    );
                    const project: IProject = {
                        projectUid,
                        documents,
                        isPublic: data && data.public,
                        name: data && data.name,
                        userUid: data && data.userUid
                    };

                    dispatch(setProject(project));
                });
            } else {
                // handle error
            }
        }
    };
};

export const openProjectDocumentTabs = () => {
    return async (dispatch: any, getState: any) => {
        const state = getState();
        const project = selectActiveProject(state);
        Object.values(propOr({}, "documents", project)).forEach(doc =>
            dispatch(
                initialTabOpenByDocumentUid(propOr(null, "documentUid", doc))
            )
        );

        dispatch(tabInitSwitch());
    };
};

export const syncProjectDocumentsWithEMFS = (
    projectUid: string,
    fileAddedCallback: any = () => {}
) => {
    return async (dispatch: any, getState: any) => {
        const cs: ICsoundObj = (store as any).getState().csound.csound;
        const encoder = new TextEncoder();
        const projRef = projects.doc(projectUid);
        const doc = await projRef.get();
        if (doc) {
            const project = doc.data();
            // TODO - Sync files to Redux as well as EMFS

            const addFileToEMFS = data => {
                if (data.type === "bin") {
                    let path = `${project!.userUid}/${project!.projectUid}/${
                        doc.id
                    }`;
                    return storageRef
                        .child(path)
                        .getDownloadURL()
                        .then(function(url) {
                            // This can be downloaded directly:
                            var xhr = new XMLHttpRequest();
                            xhr.responseType = "arraybuffer";
                            xhr.onload = function(event) {
                                let blob = xhr.response;
                                cs.writeToFS(data.name, blob);
                            };
                            xhr.open("GET", url);
                            xhr.send();
                        })
                        .catch(function(error) {
                            // Handle any errors
                        });
                } else {
                    cs.writeToFS(data.name, encoder.encode(data.value));
                }
            };

            projRef.collection("files").onSnapshot(async files => {
                files.docs.map(doc => {
                    const data = doc.data();
                    addFileToEMFS(data);
                    return null;
                });

                fileAddedCallback();

                files.docChanges().forEach(change => {
                    const doc = change.doc.data();
                    switch (change.type) {
                        case "added": {
                            addFileToEMFS(doc);
                            break;
                        }
                        case "removed": {
                            //console.log("File Removed: ", doc);
                            cs.unlinkFromFS(doc.name);
                            break;
                        }
                        case "modified": {
                            //console.log("File Modified: ", doc);
                            // TODO - need to detect filename changes, perhaps
                            // keep map of doc id => filename in Redux Store...
                            if (doc.type === "bin") {
                                let path = `${project!.userUid}/${
                                    project!.projectUid
                                }/${change.doc.id}`;
                                storageRef
                                    .child(path)
                                    .getDownloadURL()
                                    .then(function(url) {
                                        // This can be downloaded directly:
                                        var xhr = new XMLHttpRequest();
                                        xhr.responseType = "arraybuffer";
                                        xhr.onload = function(event) {
                                            let blob = xhr.response;
                                            cs.writeToFS(doc.name, blob);
                                        };
                                        xhr.open("GET", url);
                                        xhr.send();
                                    })
                                    .catch(function(error) {
                                        // Handle any errors
                                    });
                            } else {
                                cs.writeToFS(
                                    doc.name,
                                    encoder.encode(doc.value)
                                );
                            }
                            break;
                        }
                    }
                });
            });
        }
    };
};

export const closeProject = () => {
    return {
        type: CLOSE_PROJECT
    };
};

export const setProject = (project: IProject) => {
    return {
        type: SET_PROJECT,
        project
    };
};

export const resetDocumentValue = (documentUid: string) => {
    return {
        type: DOCUMENT_RESET,
        documentUid
    };
};

export const saveFile = () => {
    return async (dispatch: any) => {
        const state = store.getState() as IStore;
        const dock = state.ProjectEditorReducer.tabDock;
        const activeTab = dock.openDocuments[dock.tabIndex];
        const docUid = activeTab.uid;
        const project: IProject | null = state.projects.activeProject;
        const doc =
            project && find(project.documents, d => d.documentUid === docUid);
        if (project && !!doc) {
            try {
                projects
                    .doc(project.projectUid)
                    .collection("files")
                    .doc(doc.documentUid)
                    .update({
                        value: doc.currentValue
                    });
                dispatch({
                    type: DOCUMENT_SAVE,
                    currentValue: doc.currentValue,
                    documentUid: doc.documentUid,
                    projectUid: project.projectUid
                });
            } catch (error) {}
        }
    };
};

export const saveAllFiles = () => {
    return async (dispatch: any) => {
        const state = store.getState() as IStore;
        const project: IProject | null = state.projects.activeProject;
        const docs =
            project &&
            filter(
                Object.values(project.documents),
                d => d.isModifiedLocally === true
            );
        if (project && !isEmpty(docs)) {
            docs!.forEach(doc => {
                try {
                    projects
                        .doc(project.projectUid)
                        .collection("files")
                        .doc(doc.documentUid)
                        .update({
                            value: doc.currentValue
                        });
                    dispatch({
                        type: DOCUMENT_SAVE,
                        currentValue: doc.currentValue,
                        documentUid: doc.documentUid,
                        projectUid: project.projectUid
                    });
                } catch (error) {}
            });
        }
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
                <h1>{"Confirm deletion of file: " + filename}</h1>
                <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => cancelCallback()}
                    style={{ marginTop: 12 }}
                >
                    Cancel
                </Button>
                <Button
                    variant="outlined"
                    color="primary"
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
        const project: IProject | null = state.projects.activeProject;

        if (!!project) {
            const doc = find(
                project.documents,
                d => d.documentUid === documentUid
            );

            if (doc) {
                const cancelCallback = () => dispatch(closeModal());
                const deleteCallback = () => {
                    dispatch(tabClose(documentUid, false));
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
    documentUid: string
) => {
    return async (dispatch: any) => {
        dispatch({
            type: DOCUMENT_UPDATE_MODIFIED_LOCALLY,
            isModified,
            documentUid
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

        const reservedFilenames = useSelector((store: IStore) =>
            Object.values(store.projects.activeProject!.documents).map(
                doc => doc.filename
            )
        );

        const shouldDisable = isEmpty(input);
        return (
            <div style={{ display: "flex", flexDirection: "column" }}>
                <TextField
                    label={
                        nameCollides
                            ? input + " already exists!"
                            : "New filename"
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
                    variant="outlined"
                    color="primary"
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

        const reservedFilenames = useSelector((store: IStore) =>
            Object.values(store.projects.activeProject!.documents).map(
                doc => doc.filename
            )
        );

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
            const project = (store.getState() as IStore).projects.activeProject;

            if (project) {
                const uid = firebase.auth().currentUser!.uid;
                const doc = {
                    type: "txt",
                    name: filename,
                    value: val,
                    userUid: uid
                };
                projects
                    .doc(project.projectUid)
                    .collection("files")
                    .add(doc)
                    .then(res => {
                        const documentUid = res.id;
                        dispatch(tabOpenByDocumentUid(res.id));
                        dispatch({
                            type: DOCUMENT_INITIALIZE,
                            filename,
                            documentUid
                        });
                    });
            }
            dispatch({ type: "MODAL_CLOSE" });
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
            const project = (store.getState() as IStore).projects.activeProject;

            if (project && files && files.length > 0) {
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
                                dispatch(tabOpenByDocumentUid(res.id));
                                dispatch({
                                    type: DOCUMENT_INITIALIZE,
                                    filename,
                                    documentUid
                                });
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
            dispatch({ type: "MODAL_CLOSE" });
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

export const renameDocument = (
    documentUid: string,
    currentFilename: string
) => {
    return async (dispatch: any) => {
        const renameDocumentSuccessCallback = async (filename: string) => {
            const project = (store.getState() as IStore).projects.activeProject;

            if (project) {
                projects
                    .doc(project.projectUid)
                    .collection("files")
                    .doc(documentUid)
                    .update({ name: filename } as any)
                    .then(res => {
                        dispatch(renameDocumentLocally(documentUid, filename));
                    });
            }
            dispatch({ type: "MODAL_CLOSE" });
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
        const project: IProject | null = state.projects.activeProject;
        if (project) {
            // FIXME: does not handle binaries...
            const zip = new JSZip();
            const folder = zip.folder("project");
            const docs = Object.values(project.documents);
            docs.forEach(doc => {
                folder.file(doc.filename, doc.savedValue);
            });
            zip.generateAsync({ type: "blob" }).then(content => {
                saveAs(content, "project.zip");
            });
        }
    };
};
