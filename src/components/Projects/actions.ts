import { ICsoundObj } from "../Csound/interfaces";

export const updateDocumentValue = (val: string) => {
    return async (dispatch: any) => {
        dispatch({
            type: "DOCUMENT_UPDATE_VALUE",
            val,
        })
    }
}

export const updateScratchPadValue = (val: string) => {
    return async (dispatch: any) => {
        dispatch({
            type: "DOCUMENT_SCRATCH_PAD_VALUE",
            val,
        })
    }
}

export const initializeScratchPad = (csoundObj: ICsoundObj) => {
    return async (dispatch: any) => {
        dispatch({
            type: "DOCUMENT_SCRATCH_PAD_INITIALIZE",
            csoundObj,
        })
    }
}
