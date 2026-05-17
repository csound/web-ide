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
    LOG_OUT,
    LoginDialogMode,
    PostAuthFlow,
    SET_POST_AUTH_FLOW
} from "./types";
import { assoc, dissoc, pipe } from "ramda";

export interface ILoginReducer {
    authenticated: boolean;
    errorCode: number | undefined;
    errorMessage: string | undefined;
    failed: boolean;
    isLoginDialogOpen: boolean;
    dialogMode: LoginDialogMode;
    postAuthFlow: PostAuthFlow;
    loggedInUid: string | undefined;
    requesting: boolean;
}

const INITIAL_STATE: ILoginReducer = {
    authenticated: false,
    errorCode: undefined,
    errorMessage: undefined,
    failed: false,
    isLoginDialogOpen: false,
    dialogMode: "login",
    postAuthFlow: undefined,
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
                failed: true,
                errorCode: action.errorCode,
                errorMessage: action.errorMessage
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
                dialogMode: "login",
                requesting: false,
                authenticated: true
            };
        }
        case LOG_OUT: {
            const { ...restState } = state;
            return {
                ...restState,
                isLoginDialogOpen: false,
                dialogMode: "login",
                postAuthFlow: undefined,
                authenticated: false,
                requesting: false,
                failed: false,
                errorMessage: ""
            };
        }
        case OPEN_DIALOG: {
            return {
                ...state,
                isLoginDialogOpen: true,
                dialogMode: action.dialogMode || "login"
            };
        }
        case CLOSE_DIALOG: {
            return {
                ...state,
                isLoginDialogOpen: false,
                dialogMode: "login",
                postAuthFlow: undefined
            };
        }
        case SET_POST_AUTH_FLOW: {
            return {
                ...state,
                postAuthFlow: action.postAuthFlow
            };
        }
        default: {
            return state;
        }
    }
};

export default LoginReducer;
