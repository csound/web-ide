// import firebase from "firebase/app";
import {
    OPEN_SNACKBAR,
    CLOSE_SNACKBAR,
    SnackbarType,
    ISnackbar
} from "./types";

export const openSnackbar = (
    text: string,
    type: SnackbarType,
    timeout = 6000
) => {
    const payload: ISnackbar = {
        text,
        type,
        timeout
    };
    return {
        type: OPEN_SNACKBAR,
        payload
    };
};

export const closeSnackbar = () => {
    return {
        type: CLOSE_SNACKBAR
    };
};
