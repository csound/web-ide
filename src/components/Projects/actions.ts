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
