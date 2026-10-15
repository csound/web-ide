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
    SET_POST_AUTH_FLOW,
    UPDATE_USER_PROFILE,
    CLEAR_USER_PROFILE_SNAPSHOT
} from "./types";
import { assoc, dissoc, pipe } from "ramda";

export interface ILoginReducer {
    authenticated: boolean;
    errorCode: string | undefined;
    errorMessage: string | undefined;
    failed: boolean;
    isLoginDialogOpen: boolean;
    dialogMode: LoginDialogMode;
    postAuthFlow: PostAuthFlow;
    loggedInUid: string | undefined;
    loadedProfileUid: string | undefined;
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
    loadedProfileUid: undefined,
    // we start always with onAuthStateChanged
    requesting: true
};

const LoginReducer = (
    state: ILoginReducer = INITIAL_STATE,
    action: Record<string, any>
): ILoginReducer => {
    switch (action.type) {
        case CLEAR_USER_PROFILE_SNAPSHOT: {
            return { ...state, loadedProfileUid: undefined };
        }
        case UPDATE_USER_PROFILE: {
            return {
                ...state,
                loadedProfileUid: action.profile ? action.userUid : undefined
            };
        }
        case SIGNIN_REQUEST: {
            return {
                ...state,
                requesting: true,
                failed: false,
                errorCode: undefined,
                errorMessage: undefined
            };
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
                loadedProfileUid: undefined,
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
                authenticated: true,
                failed: false,
                errorCode: undefined,
                errorMessage: undefined
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
                loadedProfileUid: undefined,
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
