// import firebase from "firebase/app";
import {
    OPEN_SNACKBAR,
    CLOSE_SNACKBAR,
    SnackbarActionTypes,
    SnackbarType,
    ISnackbar
} from "./types";

export const openSnackbar = (
    text: string,
    type: SnackbarType
): SnackbarActionTypes => {
    const payload: ISnackbar = {
        text,
        type
    };
    return {
        type: OPEN_SNACKBAR,
        payload
    };
};
export const closeSnackbar = (): SnackbarActionTypes => {
    return {
        type: CLOSE_SNACKBAR
    };
};
