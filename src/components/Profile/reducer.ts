import {
    ProfileActionTypes,
    GET_USER_PROJECTS,
    GET_USER_PROFILE
} from "./types";

export interface State {
    readonly userProjects: any;
    readonly userProfile: any;
}

const INITIAL_STATE: State = {
    userProjects: false,
    userProfile: false
};

export default (state = INITIAL_STATE, action: ProfileActionTypes) => {
    switch (action.type) {
        case GET_USER_PROJECTS: {
            return {
                ...state,
                userProjects: action.payload
            };
        }
        case GET_USER_PROFILE: {
            return {
                ...state,
                userProfile: action.payload
            };
        }
        default: {
            return state;
        }
    }
};
