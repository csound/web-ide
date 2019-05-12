import { SIGNIN_FAIL, SIGNIN_SUCCESS, SIGNIN_REQUEST,
         OPEN_DIALOG, CLOSE_DIALOG, CREATE_USER_FAIL,
         CREATE_USER_SUCCESS, CREATE_CLEAR_ERROR,
         LOG_OUT } from "./types";
import { merge } from "lodash";

const INITIAL_STATE = {
    authenticated: false,
    isLoginDialogOpen: false,
    requesting: false,
    failed: false,
    errorCode: null,
    errorMessage: null,
};

export default (state = INITIAL_STATE, action: any) => {
    switch (action.type) {
        case SIGNIN_REQUEST: {
            return {
                authenticated: false,
                requesting: true,
                isLoginDialogOpen: true,
                failed: false,
                errorCode: null,
                errorMessage: null,
            };
        }
        case CREATE_USER_FAIL:
        case SIGNIN_FAIL: {
            return {
                authenticated: false,
                requesting: false,
                isLoginDialogOpen: true,
                failed: true,
                errorCode: action.errorCode,
                errorMessage: action.errorMessage,
            };
        }
        case CREATE_CLEAR_ERROR:
            return {
                authenticated: false,
                requesting: false,
                isLoginDialogOpen: true,
                failed: false,
                errorCode: null,
                errorMessage: false,
            };
        case CREATE_USER_SUCCESS:
        case SIGNIN_SUCCESS: {
            return {
                authenticated: true,
                isLoginDialogOpen: false,
                requesting: false,
                failed: false,
                errorCode: null,
                errorMessage: null,
            };
        }
        case LOG_OUT: {
            return {
                authenticated: false,
                requesting: false,
                isLoginDialogOpen: false,
                failed: false,
                errorCode: null,
                errorMessage: false,
            };
        }
        case OPEN_DIALOG: {
            return {...merge(state, {isLoginDialogOpen: true})};
        }
        case CLOSE_DIALOG: {
            return {...merge(state, {isLoginDialogOpen: false})};
        }
        default: {
            return state;
        }
    }
};
