import { UnknownAction } from "redux";

export const OPEN_SNACKBAR = "SNACKBAR.OPEN_SNACKBAR";
export const CLOSE_SNACKBAR = "SNACKBAR.CLOSE_SNACKBAR";

export interface ISnackbar {
    type: SnackbarType;
    text: string;
    timeout: number | typeof Number.POSITIVE_INFINITY;
}
export interface OpenSnackbar {
    type: typeof OPEN_SNACKBAR;
    payload: ISnackbar;
}

export interface CloseSnackbar {
    type: typeof CLOSE_SNACKBAR;
}

export enum SnackbarType {
    Error,
    Info,
    Warning,
    Success
}

export type SnackbarActionTypes = OpenSnackbar | CloseSnackbar | UnknownAction;
