import {
    OPEN_SNACKBAR,
    CLOSE_SNACKBAR,
    OpenSnackbar,
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
    state: ISnackbarReducer | undefined,
    unknownAction: SnackbarActionTypes
): ISnackbarReducer => {
    if (!state) {
        return INITIAL_STATE;
    }

    switch (unknownAction.type) {
        case OPEN_SNACKBAR: {
            const action = unknownAction as OpenSnackbar;
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
