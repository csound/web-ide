import React from "react";
import { closeModal, openSimpleModal } from "../Modal/actions";
import { resetDocumentValue } from "../Projects/actions";
import Button from "@material-ui/core/Button";
import {
    MANUAL_LOOKUP_STRING,
    TAB_DOCK_INITIAL_OPEN_TAB_BY_DOCUMENT_UID,
    TAB_DOCK_OPEN_TAB_BY_DOCUMENT_UID,
    TAB_DOCK_CLOSE,
    TAB_DOCK_INIT_SWITCH_TAB,
    TAB_DOCK_SWITCH_TAB,
    TAB_CLOSE,
    TOGGLE_MANUAL_PANEL,
    SET_MANUAL_PANEL_OPEN,
    STORE_EDITOR_INSTANCE
} from "./types";

export const initialTabOpenByDocumentUid = (documentUid: string) => {
    return {
        type: TAB_DOCK_INITIAL_OPEN_TAB_BY_DOCUMENT_UID,
        documentUid
    };
};

export const tabOpenByDocumentUid = (documentUid: string) => {
    return async (dispatch: any) => {
        dispatch({
            type: TAB_DOCK_OPEN_TAB_BY_DOCUMENT_UID,
            documentUid
        });
    };
};

export const closeTabDock = () => {
    return {
        type: TAB_DOCK_CLOSE
    };
};

const closeUnsavedTabPrompt = (cancelCallback, closeWithoutSavingCallback) => {
    return (() => {
        return (
            <div style={{ display: "flex", flexDirection: "column" }}>
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
                    color="primary"
                    onClick={() => closeWithoutSavingCallback()}
                    style={{ marginTop: 12 }}
                >
                    Close without saveing
                </Button>
            </div>
        );
    }) as React.FC;
};

export const tabClose = (documentUid: string, isModified: boolean) => {
    return async (dispatch: any) => {
        if (!isModified) {
            dispatch({
                type: TAB_CLOSE,
                documentUid
            });
        } else {
            const cancelCallback = () => dispatch(closeModal());
            const closeWithoutSavingCallback = () => {
                dispatch(closeModal());
                dispatch({
                    type: TAB_CLOSE,
                    documentUid
                });
                dispatch(resetDocumentValue(documentUid));
            };

            const closeUnsavedTabPromptComp = closeUnsavedTabPrompt(
                cancelCallback,
                closeWithoutSavingCallback
            );
            dispatch(openSimpleModal(closeUnsavedTabPromptComp));
        }
    };
};

export const tabSwitch = (index: number) => {
    return {
        type: TAB_DOCK_SWITCH_TAB,
        tabIndex: index
    };
};

export const lookupManualString = (manualLookupString: string | null) => {
    return {
        type: MANUAL_LOOKUP_STRING,
        manualLookupString
    };
};

export const toggleManualPanel = () => {
    return {
        type: TOGGLE_MANUAL_PANEL
    };
};

export const setManualPanelOpen = (open: boolean) => {
    return {
        type: SET_MANUAL_PANEL_OPEN,
        open
    };
};

// Basically sets tabIndex to 0 if it's -1
// as tabIndex -1 signals that the tabs aren't initialized
export const tabInitSwitch = () => {
    return {
        type: TAB_DOCK_INIT_SWITCH_TAB
    };
};

export const storeEditorInstance = (
    editorInstance: any,
    projectUid: string,
    documentUid: string
) => {
    return async (dispatch: any) => {
        dispatch({
            type: STORE_EDITOR_INSTANCE,
            editorInstance,
            projectUid,
            documentUid
        });
    };
};
