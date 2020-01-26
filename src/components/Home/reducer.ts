import { HomeActionTypes, GET_TAGS } from "./types";

export interface State {
    readonly tags: any;
}

const INITIAL_STATE: State = {
    tags: false
};

export default (state = INITIAL_STATE, action: HomeActionTypes) => {
    switch (action.type) {
        case GET_TAGS: {
            return {
                ...state,
                tags: action.payload
            };
        }
        default: {
            return state;
        }
    }
};
