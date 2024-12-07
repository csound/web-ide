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

export interface ILoginReducer {
    authenticated: boolean;
    errorCode: number | undefined;
    errorMessage: string | undefined;
    failed: boolean;
    isLoginDialogOpen: boolean;
    loggedInUid: string | undefined;
    requesting: boolean;
}

const INITIAL_STATE: ILoginReducer = {
    authenticated: false,
    errorCode: undefined,
    errorMessage: undefined,
    failed: false,
    isLoginDialogOpen: false,
    loggedInUid: undefined,
    // we start always with onAuthStateChanged
    requesting: true
};

const LoginReducer = (
    state: ILoginReducer = INITIAL_STATE,
    action: Record<string, any>
): ILoginReducer => {
    switch (action.type) {
        case SIGNIN_REQUEST: {
            return { ...state, requesting: true };
        }
        case SET_REQUESTING_STATUS: {
            return { ...state, requesting: action.status };
        }
        case CREATE_USER_FAIL:
        case SIGNIN_FAIL: {
            return {
                ...state,
                requesting: false,
                authenticated: false,
                failed: true
            };
        }
        case CREATE_CLEAR_ERROR: {
            const { ...restState } = state;
            return {
                ...restState,
                failed: false,
                errorMessage: ""
            };
        }
        case CREATE_USER_SUCCESS:
        case SIGNIN_SUCCESS: {
            return {
                ...state,
                loggedInUid: action.user.uid,
                isLoginDialogOpen: false,
                requesting: false,
                authenticated: true
            };
        }
        case LOG_OUT: {
            const { ...restState } = state;
            return {
                ...restState,
                isLoginDialogOpen: false,
                authenticated: false,
                requesting: false,
                failed: false,
                errorMessage: ""
            };
        }
        case OPEN_DIALOG: {
            return { ...state, isLoginDialogOpen: true };
        }
        case CLOSE_DIALOG: {
            return { ...state, isLoginDialogOpen: false };
        }
        default: {
            return state;
        }
    }
};

export default LoginReducer;
