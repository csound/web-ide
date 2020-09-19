import {
    OPEN_SNACKBAR,
    CLOSE_SNACKBAR,
    SnackbarType,
    SnackbarActionTypes
} from "./types";

export interface State {
    readonly text: string;
    readonly type: SnackbarType;
    readonly open: boolean;
    readonly timeout: number | typeof Infinity;
}

const INITIAL_STATE: State = {
    text: "",
    type: SnackbarType.Info,
    open: false,
    timeout: 6000
};

export default (state = INITIAL_STATE, action: SnackbarActionTypes) => {
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
