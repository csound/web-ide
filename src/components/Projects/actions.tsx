import React, { useState } from "react";
import { tabOpenByDocumentUid } from "../Layout/actions";
import { generateUid } from "../../utils";
import { openSimpleModal } from "../Modal/actions";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import { isEmpty } from "lodash";
import { DOCUMENT_UPDATE_VALUE, DOCUMENT_NEW, SET_PROJECT } from "./types";
import { projects } from "../../config/firestore";

export const loadProjectFromFirestore = (projectUid: string) => {
    return async (dispatch: any) => {
        if(projectUid) {  
            const projRef = projects.doc(projectUid);
            projRef.get()
            .then(doc => {
                dispatch(setProject(doc.data));

                // TODO - Sync files to Redux as well as EMFS
                projRef.collection('files').onSnapshot(docs => {
                    docs.docChanges().forEach(change => {
                        switch(change.type) {
                            case "added":
                                break;
                            case "removed":
                                break;
                            case "modified":
                                break;
                        }
                    })                    
                })
            })
            .catch(err => {

            })
        }
    }
}

export const setProject = (project: any) => {
    return async (dispatch: any) => {
        dispatch({
            type: SET_PROJECT,
            project 
        })
    }
}

export const updateDocumentValue = (val: string, projectUid: string, documentUid: string) => {
    return async (dispatch: any) => {
        dispatch({
            type: DOCUMENT_UPDATE_VALUE,
            val,
            projectUid,
            documentUid,
        })
    }
}

const newDocumentPrompt = (callback: (fileName: string) => void) => {
    return (() => {
        const [input, setInput] = useState("");
        const shouldDisable = isEmpty(input);
        return (
            <div style={{display: "flex", flexDirection: "column"}}>
                <TextField label="New filename" value={input} onChange={e => setInput(e.target.value)} />
                <Button variant="outlined"
                        color="primary"
                        disabled={shouldDisable}
                        onClick={() => callback(input)}
                        style={{marginTop: 12}}>
                    Create
                </Button>
            </div>
        );
    }) as React.FC
}

export const newDocument = (projectUid: string, val: string) => {

    return async (dispatch: any) => {
        const newDocumentSuccessCallback = async (fileName: string) => {

            const newDocUid = generateUid(fileName);

            await dispatch({
                type: DOCUMENT_NEW,
                documentUid: newDocUid,
                projectUid,
                name: fileName,
                val,
            })
            dispatch(tabOpenByDocumentUid(projectUid, newDocUid));
            dispatch({type: "MODAL_CLOSE"});
        }
        const newDocumentPromptComp = newDocumentPrompt(newDocumentSuccessCallback);
        dispatch(openSimpleModal(newDocumentPromptComp));
    }
}

export const storeEditorInstance = (editorInstance: any, projectUid: string, documentUid: string) => {
    return async (dispatch: any) => {
        dispatch({
            type: "STORE_EDITOR_INSTANCE",
            editorInstance,
            projectUid,
            documentUid,
        })
    }
}
