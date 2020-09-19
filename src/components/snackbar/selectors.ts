// import { createSelector } from "reselect";
import { State } from "./reducer";

export const selectSnackbarOpen = (store: any) => {
    const state: State = store.SnackbarReducer;
    return state.open;
};

export const selectSnackbarType = (store: any) => {
    const state: State = store.SnackbarReducer;
    return state.type;
};

export const selectSnackbarText = (store: any) => {
    const state: State = store.SnackbarReducer;
    return state.text;
};

export const selectSnackbarTimeout = (store: any) => {
    const state: State = store.SnackbarReducer;
    return state.timeout;
};
