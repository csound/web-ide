import { store } from "../../store";
import { ICsoundObj, RUN_CSOUND, SET_CSOUND } from "./types";
import { IStore } from "../../db/interfaces";

export const setCsound = (csound: ICsoundObj) => {
    return {
        type: SET_CSOUND,
        csound
    };
};

export const runCsound = () => {
    return {
        type: RUN_CSOUND
    };
};

export const writeDocumentToEMFS = (path: string, text: string): void => {
    const storeState = store.getState() as IStore;
    const csound = storeState.csound.csound;
    console.log(csound);
};
