import {
    TAB_DOCK_INITIAL_OPEN_TAB_BY_DOCUMENT_UID,
    TAB_DOCK_OPEN_TAB_BY_DOCUMENT_UID,
    TAB_CLOSE,
    TAB_DOCK_INIT_SWITCH_TAB,
    TAB_DOCK_SWITCH_TAB,
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

export const tabClose = (documentUid: string) => {
    return {
        type: TAB_CLOSE,
        documentUid
    };
};

export const tabSwitch = (index: number) => {
    return {
        type: TAB_DOCK_SWITCH_TAB,
        tabIndex: index
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
