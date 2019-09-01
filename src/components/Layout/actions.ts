import {
    TAB_DOCK_OPEN_TAB_BY_DOCUMENT_UID,
    TAB_CLOSE,
    TAB_DOCK_SWITCH_TAB
} from "./types";

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
