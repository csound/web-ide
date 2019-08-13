// import { ICsoundObj } from "../Csound/interfaces";

export const updateDocumentValue = (val: string, projectUid: string, documentUid: string) => {
    return async (dispatch: any) => {
        dispatch({
            type: "DOCUMENT_UPDATE_VALUE",
            val,
            projectUid,
            documentUid,
        })
    }
}

export const newDocument = (projectUid: string, name: string, val: string) => {
    return async (dispatch: any) => {
        dispatch({
            type: "DOCUMENT_NEW",
            projectUid,
            name,
            val,
        })
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
