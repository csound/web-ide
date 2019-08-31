import { ProfileActionTypes, GET_USER_PROJECTS } from "./types";

export interface State {
    readonly userProjects: any;
}

const INITIAL_STATE: State = {
    userProjects: false
};

export default (state = INITIAL_STATE, action: ProfileActionTypes) => {
    switch (action.type) {
        case GET_USER_PROJECTS: {
            return {
                ...state,
                userProjects: action.payload
            };
        }
        default: {
            return state;
        }
    }
};
