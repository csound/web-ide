import { store } from "../../store";
import { ICsoundObj } from "./interfaces";

export const setCsound = (csound: ICsoundObj) => {
    return {
        type: "SET_CSOUND",
        csound,
    };
};

export const writeDocumentToEMFS = (path: string, text: string): void => {
    const storeState = store.getState();
    const csound: ICsoundObj = storeState.csound.csound;
    console.log(csound);
};
