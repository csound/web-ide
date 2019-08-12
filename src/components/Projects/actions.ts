// import { ICsoundObj } from "../Csound/interfaces";

export const updateDocumentValue = (val: string, projectIndex: number, documentIndex: number) => {
    return async (dispatch: any) => {
        dispatch({
            type: "DOCUMENT_UPDATE_VALUE",
            val,
            projectIndex,
            documentIndex,
        })
    }
}

export const newDocument = (projectIndex: number, name: string, val: string) => {
    return async (dispatch: any) => {
        dispatch({
            type: "DOCUMENT_NEW",
            projectIndex,
            name,
            val,
        })
    }
}