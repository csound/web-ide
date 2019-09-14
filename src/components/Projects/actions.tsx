import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
    initialTabOpenByDocumentUid,
    tabInitSwitch,
    tabOpenByDocumentUid
} from "../ProjectEditor/actions";
import { closeModal, openSimpleModal } from "../Modal/actions";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import { filter, find, isEmpty, reduce, some } from "lodash";
import {
    DOCUMENT_INITIALIZE,
    DOCUMENT_RESET,
    DOCUMENT_SAVE,
    DOCUMENT_UPDATE_VALUE,
    DOCUMENT_UPDATE_MODIFIED_LOCALLY,
    SET_PROJECT,
    IProject,
    IDocument
} from "./types";
import { filenameToType, textOrBinary } from "./utils";
import { IStore } from "../../db/interfaces";
import { projects } from "../../config/firestore";
import { store } from "../../store";
import { ICsoundObj } from "../Csound/types";
import JSZip from "jszip";
import { saveAs } from 'file-saver';

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
                        name: data && data.name
                    };

                    dispatch(setProject(project));

                    (Object as any)
                        .values(documents)
                        .forEach(doc =>
                            dispatch(
                                initialTabOpenByDocumentUid(doc.documentUid)
                            )
                        );

                    dispatch(tabInitSwitch());

                    const cs: ICsoundObj = (store as any).getState().csound
                        .csound;
                    const encoder = new TextEncoder();
                    files.docChanges().forEach(change => {
                        const doc = change.doc.data();
                        switch (change.type) {
                            case "added": {
                                //console.log("File Added: ", doc);
                                cs.writeToFS(
                                    doc.name,
                                    encoder.encode(doc.value)
                                );
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
                                cs.writeToFS(
                                    doc.name,
                                    encoder.encode(doc.value)
                                );
                                break;
                            }
                        }
                    });
                });
            } else {
                // handle error
            }
        }
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

const newDocumentPrompt = (callback: (fileName: string) => void) => {
    return (() => {
        const [input, setInput] = useState("");
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
                    Create
                </Button>
            </div>
        );
    }) as React.FC;
};

const addDocumentPrompt = (callback: (fileName: string) => void) => {
    return (() => {
        const [input, setInput] = useState("");
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
                    Create
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
                const doc = {
                    type: "txt",
                    name: filename,
                    value: val
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
            newDocumentSuccessCallback
        );
        dispatch(openSimpleModal(newDocumentPromptComp));
    };
};

export const addDocument = (projectUid: string) => {
    return async (dispatch: any) => {
        const addDocumentSuccessCallback = async (filename: string) => {
            const project = (store.getState() as IStore).projects.activeProject;

            if (project) {
                const doc = {
                    type: textOrBinary(filename),
                    name: filename,
                    value: "" 
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
        const addDocumentPromptComp = addDocumentPrompt(
            addDocumentSuccessCallback
        );
        dispatch(openSimpleModal(addDocumentPromptComp));
    };
};

export const exportProject = () => {
    return async (dispatch: any) => {
        const state = store.getState() as IStore;
        const project: IProject | null = state.projects.activeProject;
        if (project) {
            const zip = new JSZip(); 
            const folder = zip.folder('project'); 
            const docs = Object.values(project.documents);
            docs.forEach(doc => {
                folder.file(doc.filename, doc.savedValue);
            });
            zip.generateAsync({type: 'blob'})
                .then(content => {
                    saveAs(content, 'project.zip')
                });
        }
    };
};