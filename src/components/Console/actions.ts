import {
    SET_CLEAR_CONSOLE_CALLBACK,
    SET_PRINT_TO_CONSOLE_CALLBACK
} from "./types";

export const setClearConsoleCallback = (callback: () => void) => {
    return async (dispatch: any) => {
        dispatch({
            type: SET_CLEAR_CONSOLE_CALLBACK,
            callback
        });
    };
};

export const setPrintToConsoleCallback = (callback: (text: string) => void) => {
    return async (dispatch: any) => {
        dispatch({
            type: SET_PRINT_TO_CONSOLE_CALLBACK,
            callback
        });
    };
};
