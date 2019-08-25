import { tabOpenByDocumentUid } from "../Layout/actions";
import { generateUid } from "../../utils";

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
    const newDocUid = generateUid(name);

    return async (dispatch: any) => {
        await dispatch({
            type: "DOCUMENT_NEW",
            documentUid: newDocUid,
            projectUid,
            name,
            val,
        })
        dispatch(tabOpenByDocumentUid(projectUid, newDocUid));
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
