import {
    SET_CLEAR_CONSOLE_CALLBACK,
    SET_PRINT_TO_CONSOLE_CALLBACK
} from "./types";

export interface IConsoleReducer {
    clearConsole: () => void;
    printToConsole: (text: string) => void;
}

export default (state: any, action: any): IConsoleReducer => {
    switch (action.type) {
        case SET_CLEAR_CONSOLE_CALLBACK: {
            state.clearConsole = action.callback;
            return { ...state };
        }
        case SET_PRINT_TO_CONSOLE_CALLBACK: {
            return {
                printToConsole: action.callback,
                clearConsole: state.clearConsole
            };
        }
        default: {
            return (
                state ||
                ({
                    clearConsole: () => {},
                    printToConsole: text => {}
                } as IConsoleReducer)
            );
        }
    }
};
