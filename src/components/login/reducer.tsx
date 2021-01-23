import {
    SET_REQUESTING_STATUS,
    SIGNIN_FAIL,
    SIGNIN_SUCCESS,
    SIGNIN_REQUEST,
    OPEN_DIALOG,
    CLOSE_DIALOG,
    CREATE_USER_FAIL,
    CREATE_USER_SUCCESS,
    CREATE_CLEAR_ERROR,
    LOG_OUT
} from "./types";
import { assoc, dissoc, pipe } from "ramda";

const INITIAL_STATE = {
    authenticated: false,
    errorCode: undefined,
    errorMessage: undefined,
    failed: false,
    isLoginDialogOpen: false,
    loggedInUid: undefined,
    // we start always with onAuthStateChanged
    requesting: true
};

const LoginReducer = (state = INITIAL_STATE, action: any) => {
    switch (action.type) {
        case SIGNIN_REQUEST: {
            return assoc("requesting", true, state);
        }
        case SET_REQUESTING_STATUS: {
            return assoc("requesting", action.status, state);
        }
        case CREATE_USER_FAIL:
        case SIGNIN_FAIL: {
            return pipe(
                assoc("requesting", false),
                assoc("authenticated", false),
                assoc("failed", true)
            )(state);
        }
        case CREATE_CLEAR_ERROR:
            return pipe(
                assoc("failed", false),
                dissoc("errorCode"),
                assoc("errorMessage", false)
            )(state);
        case CREATE_USER_SUCCESS:
        case SIGNIN_SUCCESS: {
            return pipe(
                assoc("loggedInUid", action.user.uid),
                assoc("isLoginDialogOpen", false),
                assoc("requesting", false),
                assoc("authenticated", true)
            )(state);
        }
        case LOG_OUT: {
            return pipe(
                assoc("isLoginDialogOpen", false),
                assoc("authenticated", false),
                assoc("requesting", false),
                assoc("failed", false),
                dissoc("errorCode"),
                assoc("errorMessage", false)
            )(state);
        }
        case OPEN_DIALOG: {
            return assoc("isLoginDialogOpen", true, state);
        }
        case CLOSE_DIALOG: {
            return assoc("isLoginDialogOpen", false, state);
        }
        default: {
            return state;
        }
    }
};

export default LoginReducer;
