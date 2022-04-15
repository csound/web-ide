import {
    OPEN_SNACKBAR,
    CLOSE_SNACKBAR,
    SnackbarType,
    SnackbarActionTypes
} from "./types";

export interface ISnackbarReducer {
    readonly text: string;
    readonly type: SnackbarType;
    readonly open: boolean;
    readonly timeout: number | typeof Number.POSITIVE_INFINITY;
}

const INITIAL_STATE: ISnackbarReducer = {
    text: "",
    type: SnackbarType.Info,
    open: false,
    timeout: 6000
};

const SnackbarReducer = (
    state = INITIAL_STATE,
    action: SnackbarActionTypes
): ISnackbarReducer => {
    switch (action.type) {
        case OPEN_SNACKBAR: {
            return {
                ...state,
                ...action.payload,
                open: true
            };
        }
        case CLOSE_SNACKBAR: {
            return {
                ...state,
                open: false
            };
        }
        default: {
            return state;
        }
    }
};

export default SnackbarReducer;
