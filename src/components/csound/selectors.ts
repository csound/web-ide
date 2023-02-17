import { RootState } from "@root/store";
import { ICsoundReducer } from "./reducer";
import { ICsoundStatus } from "./types";

export const selectCsoundStatus = (store: RootState): ICsoundStatus => {
    const state: ICsoundReducer = store.csound;
    return state.status;
};
