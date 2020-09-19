import { ICsoundReducer } from "./reducer";

export const selectCsound = (store: any) => {
    const state: ICsoundReducer = store.csound;
    return state.csound;
};

export const selectCsoundStatus = (store: any) => {
    const state: ICsoundReducer = store.csound;
    return state.status;
};
