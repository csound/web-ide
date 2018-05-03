import { READ_ALL } from "../actions/types";

const restRequest = {
    value: false,
    requesting: false
};

const INITIAL_STATE = {
    readAll: { ...restRequest }
};

export default (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case READ_ALL.REQUEST: {
            return {
                ...state,
                readAll: { value: false, requesting: true, error: false }
            };
        }
        case READ_ALL.SUCCESS: {
            return {
                ...state,
                readAll: {
                    value: action.payload,
                    requesting: false,
                    error: false
                }
            };
        }
        case READ_ALL.FAIL: {
            return {
                ...state,
                readAll: {
                    value: false,
                    requesting: false
                }
            };
        }
        default:
            return state;
    }
};
