import { AUTH_FAIL, AUTH_SUCCESS, AUTH_REQUEST } from "./types";
const INITIAL_STATE = {
    authenticated: false,
    requesting: false,
    failed: false
};

export default (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case AUTH_REQUEST: {
            return { authenticated: false, requesting: true, failed: false };
        }
        case AUTH_FAIL: {
            return { authenticated: false, requesting: false, failed: true };
        }
        case AUTH_SUCCESS: {
            return { authenticated: true, requesting: false, failed: false };
        }
        default: {
            return state;
        }
    }
};
