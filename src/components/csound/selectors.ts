import { IStore } from "@store/types";
import { Csound, CsoundObj } from "@csound/browser";
import { ICsoundReducer } from "./reducer";
import { ICsoundStatus } from "./types";

export const selectCsound = (store: IStore): CsoundObj | undefined => {
    const state: ICsoundReducer = store.csound;
    return state.csound;
};

export const selectCsoundStatus = (store: IStore): ICsoundStatus => {
    const state: ICsoundReducer = store.csound;
    return state.status;
};

export const selectCsoundFactory = (store: IStore): Csound | undefined => {
    const state: ICsoundReducer = store.csound;
    return state.factory;
};
