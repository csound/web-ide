export const OPEN_SNACKBAR = "SNACKBAR.OPEN_SNACKBAR";
export const CLOSE_SNACKBAR = "SNACKBAR.CLOSE_SNACKBAR";

export interface ISnackbar {
    type: SnackbarType;
    text: string;
}
interface OpenSnackbar {
    type: typeof OPEN_SNACKBAR;
    payload: ISnackbar;
}

interface CloseSnackbar {
    type: typeof CLOSE_SNACKBAR;
}

export enum SnackbarType {
    Error,
    Info,
    Warning,
    Success
}

export type SnackbarActionTypes = OpenSnackbar | CloseSnackbar;
