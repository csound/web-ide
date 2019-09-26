import {
    ProfileActionTypes,
    GET_USER_PROJECTS,
    GET_USER_PROFILE,
    GET_USER_IMAGE_URL,
    SET_TAGS_INPUT,
    SET_CURRENT_TAG_TEXT,
    GET_TAGS
} from "./types";
import facePng from "./face.png";
export interface State {
    readonly userProjects: any;
    readonly userProfile: any;
    readonly userImageURL: string;
    readonly loggedInUid: string | null;
    readonly profileUid: string | null;
    readonly currentTagText: string;
    readonly tagsInput: any[];
    readonly tags: any[];
}

const INITIAL_STATE: State = {
    userProjects: false,
    userProfile: false,
    userImageURL: facePng,
    loggedInUid: null,
    profileUid: null,
    currentTagText: "",
    tagsInput: [],
    tags: []
};

export default (state = INITIAL_STATE, action: ProfileActionTypes) => {
    switch (action.type) {
        case GET_TAGS: {
            return {
                ...state,
                tags: action.payload
            };
        }
        case SET_TAGS_INPUT: {
            return {
                ...state,
                tagsInput: action.payload
            };
        }
        case GET_USER_PROJECTS: {
            return {
                ...state,
                userProjects: action.payload
            };
        }
        case GET_USER_PROFILE: {
            return {
                ...state,
                userProfile: action.payload.profile,
                profileUid: action.payload.profileUid,
                loggedInUid: action.payload.loggedInUid
            };
        }
        case GET_USER_IMAGE_URL: {
            return {
                ...state,
                userImageURL: action.payload
            };
        }
        case SET_CURRENT_TAG_TEXT: {
            return {
                ...state,
                currentTagText: action.payload
            };
        }
        default: {
            return state;
        }
    }
};
