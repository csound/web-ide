// import { createSelector } from "reselect";
import { ISnackbarReducer } from "./reducer";
import { SnackbarType } from "./types";
import { RootState } from "@store/types";

export const selectSnackbarOpen = (store: RootState): boolean => {
    const state: ISnackbarReducer = store.SnackbarReducer;
    return state.open;
};

export const selectSnackbarType = (store: RootState): SnackbarType => {
    const state: ISnackbarReducer = store.SnackbarReducer;
    return state.type;
};

export const selectSnackbarText = (store: RootState): string => {
    const state: ISnackbarReducer = store.SnackbarReducer;
    return state.text;
};

export const selectSnackbarTimeout = (store: RootState): number => {
    const state: ISnackbarReducer = store.SnackbarReducer;
    return state.timeout;
};
