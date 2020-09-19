import {
    SET_CLEAR_CONSOLE_CALLBACK,
    SET_PRINT_TO_CONSOLE_CALLBACK
} from "./types";

export const setClearConsoleCallback = (callback: any) => ({
    type: SET_CLEAR_CONSOLE_CALLBACK,
    callback
});

type CB = (text: string) => void;

export const setPrintToConsoleCallback = (callback?: CB) => ({
    type: SET_PRINT_TO_CONSOLE_CALLBACK,
    callback: callback
});
