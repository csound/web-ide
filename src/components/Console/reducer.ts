import {
    SET_CLEAR_CONSOLE_CALLBACK,
    SET_PRINT_TO_CONSOLE_CALLBACK
} from "./types";
import { assoc } from "ramda";

type ClearConsole = () => void;
type PrintToConsole = (text: string) => void;

export interface IConsoleReducer {
    clearConsole: ClearConsole | null;
    printToConsole: PrintToConsole | null;
}

const initState: IConsoleReducer = {
    clearConsole: null,
    printToConsole: null
};

export default (
    state: IConsoleReducer | undefined,
    action: any
): IConsoleReducer => {
    switch (action.type) {
        case SET_CLEAR_CONSOLE_CALLBACK: {
            return assoc("clearConsole", action.callback, state);
        }
        case SET_PRINT_TO_CONSOLE_CALLBACK: {
            return assoc("printToConsole", action.callback, state);
        }
        default: {
            return state || initState;
        }
    }
};
