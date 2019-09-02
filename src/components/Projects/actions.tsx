import React, { useState } from "react";
import { useSelector } from "react-redux";
import { tabOpenByDocumentUid } from "../ProjectEditor/actions";
import { generateUid } from "../../utils";
import { openSimpleModal } from "../Modal/actions";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import { find, isEmpty, reduce, some } from "lodash";
import {
    DOCUMENT_UPDATE_VALUE,
    DOCUMENT_NEW,
    SET_PROJECT,
    IProject
} from "./types";
import { IStore } from "../../db/interfaces";
import { projects } from "../../config/firestore";
import { store } from "../../store";
import { ICsoundObj } from "../Csound/types";

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
                                type: docData["type"]
                            };
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
                            dispatch(tabOpenByDocumentUid(doc.documentUid))
                        );

                    const cs: ICsoundObj = (store as any).getState().csound
                        .csound;
                    const encoder = new TextEncoder();
                    files.docChanges().forEach(change => {
                        switch (change.type) {
                            case "added": {
                                const doc = change.doc.data();
                                //console.log("File Added: ", doc);
                                cs.writeToFS(
                                    doc.name,
                                    encoder.encode(doc.value)
                                );
                                break;
                            }
                            case "removed":
                                break;
                            case "modified": {
                                const doc = change.doc.data();
                                //console.log("File Modified: ", doc);
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

export const saveFile = () => {
    return async (dispatch: any) => {
        const state = store.getState();
        const project: IProject = state.projects.activeProject;
        const dock = state.ProjectEditorReducer.tabDock;
        const activeTab = dock.openDocuments[dock.tabIndex];
        const docUid = activeTab.uid;

        console.log(state, project, dock, docUid);

        if (project) {
            const doc = find(project.documents, d => d.documentUid === docUid);

            console.log(doc);
            if (doc) {
                projects
                    .doc(project.projectUid)
                    .collection("files")
                    .doc(doc.documentUid)
                    .update({
                        value: doc.currentValue
                    });
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
                    style={{ marginTop: 12 }}
                >
                    Create
                </Button>
            </div>
        );
    }) as React.FC;
};

export const newDocument = (projectUid: string, val: string) => {
    return async (dispatch: any) => {
        const newDocumentSuccessCallback = async (fileName: string) => {
            const newDocUid = generateUid(fileName);

            await dispatch({
                type: DOCUMENT_NEW,
                documentUid: newDocUid,
                projectUid,
                name: fileName,
                val
            });
            dispatch(tabOpenByDocumentUid(newDocUid));
            dispatch({ type: "MODAL_CLOSE" });
        };
        const newDocumentPromptComp = newDocumentPrompt(
            newDocumentSuccessCallback
        );
        dispatch(openSimpleModal(newDocumentPromptComp));
    };
};
