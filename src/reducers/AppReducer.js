import { LOAD_CSOUND } from "../actions/types";

const restRequest = {
    value: false,
    requesting: false
};

const INITIAL_STATE = {
    loadCsound: { ...restRequest }
};

export default (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case LOAD_CSOUND.REQUEST: {
            return {
                ...state,
                loadCsound: { value: false, requesting: true }
            };
        }
        case LOAD_CSOUND.SUCCESS: {
            return {
                ...state,
                loadCsound: {
                    value: true,
                    requesting: false,
                }
            };
        }
        case LOAD_CSOUND.FAIL: {
            return {
                ...state,
                loadCsound: {
                    value: false,
                    requesting: false
                }
            };
        }
        default:
            return state;
    }
};
