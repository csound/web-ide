import { SIGNIN_FAIL, SIGNIN_SUCCESS, SIGNIN_REQUEST,
         OPEN_DIALOG, CLOSE_DIALOG } from "./types";
import { merge } from "lodash";

const INITIAL_STATE = {
    authenticated: false,
    isLoginDialogOpen: false,
    requesting: false,
    failed: false
};

export default (state = INITIAL_STATE, action: any) => {
    switch (action.type) {
        case SIGNIN_REQUEST: {
            return {
                authenticated: false,
                requesting: true,
                isLoginDialogOpen: true,
                failed: false
            };
        }
        case SIGNIN_FAIL: {
            return {
                authenticated: false,
                requesting: false,
                isLoginDialogOpen: true,
                failed: true
            };
        }
        case SIGNIN_SUCCESS: {
            return {
                authenticated: true,
                isLoginDialogOpen: false,
                requesting: false,
                failed: false
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
