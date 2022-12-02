import { CsoundObj as CsoundObj6 } from "@csound/browser";
import { CsoundObj as CsoundObj7 } from "csound7";
import { IStore } from "@store/types";
import { ICsoundReducer } from "./reducer";
import { ICsoundStatus } from "./types";

export const selectCsound = (
    store: IStore
): CsoundObj6 | CsoundObj7 | undefined => {
    const state: ICsoundReducer = store.csound;
    return state.csound;
};

export const selectCsoundStatus = (store: IStore): ICsoundStatus => {
    const state: ICsoundReducer = store.csound;
    return state.status;
};
