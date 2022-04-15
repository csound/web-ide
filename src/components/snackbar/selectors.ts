// import { createSelector } from "reselect";
import { ISnackbarReducer } from "./reducer";
import { SnackbarType } from "./types";
import { IStore } from "@store/types";

export const selectSnackbarOpen = (store: IStore): boolean => {
    const state: ISnackbarReducer = store.SnackbarReducer;
    return state.open;
};

export const selectSnackbarType = (store: IStore): SnackbarType => {
    const state: ISnackbarReducer = store.SnackbarReducer;
    return state.type;
};

export const selectSnackbarText = (store: IStore): string => {
    const state: ISnackbarReducer = store.SnackbarReducer;
    return state.text;
};

export const selectSnackbarTimeout = (store: IStore): number => {
    const state: ISnackbarReducer = store.SnackbarReducer;
    return state.timeout;
};
