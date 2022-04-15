import {
    SET_CLEAR_CONSOLE_CALLBACK,
    SET_PRINT_TO_CONSOLE_CALLBACK
} from "./types";

type CB = (text: string) => void;

export const setClearConsoleCallback = (callback: CB): Record<string, any> => ({
    type: SET_CLEAR_CONSOLE_CALLBACK,
    callback
});

export const setPrintToConsoleCallback = (
    callback?: CB
): Record<string, any> => ({
    type: SET_PRINT_TO_CONSOLE_CALLBACK,
    callback: callback
});
