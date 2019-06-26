import { IDocument, IScratchPad } from "./interfaces";
import { merge } from "lodash";

export interface IDocumentsReducer {
    documents: IDocument[];
    scratchPad: IScratchPad;
};


const initialDocumentsState: IDocumentsReducer = {
    documents: [],
    scratchPad: {
        currentValue: "",
        csoundInstance: null,
        type: "orc",
    }
}

export default (state: IDocumentsReducer, action: any) => {
    switch (action.type) {
        case "DOCUMENT_SCRATCH_PAD_VALUE": {
            return merge(state, {
                scratchPad: {
                    currentValue: action.val,
                },
            });
        }
        case "DOCUMENT_SCRATCH_PAD_INITIALIZE": {
            return merge(state, {
                scratchPad: {
                    csoundInstance: action.csoundObj,
                },
            });
        }
        default: {
            return initialDocumentsState;
        }
    }
}
