import {
    ProfileActionTypes,
    GET_USER_PROJECTS,
    GET_USER_PROFILE,
    GET_USER_IMAGE_URL,
    SET_TAGS_INPUT,
    SET_CURRENT_TAG_TEXT,
    GET_TAGS,
    SET_PREVIOUS_PROJECT_TAGS,
    SET_CURRENTLY_PLAYING_PROJECT,
    SET_LIST_PLAY_STATE,
    SET_CSOUND_STATUS,
    SHOULD_REDIRECT_REQUEST,
    SHOULD_REDIRECT_YES,
    SHOULD_REDIRECT_NO,
    REFRESH_USER_PROFILE
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
    readonly previousProjectTags: any[];
    readonly currentlyPlayingProject: string | false;
    readonly listPlayState: string;
    readonly csoundStatus: string | false;
    readonly previousCsoundStatus: string | false;
    readonly shouldRedirect: string | false;
}

const INITIAL_STATE: State = {
    userProjects: false,
    userProfile: false,
    userImageURL: facePng,
    loggedInUid: null,
    profileUid: null,
    currentTagText: "",
    tagsInput: [],
    tags: [],
    previousProjectTags: [],
    currentlyPlayingProject: false,
    listPlayState: "stopped",
    csoundStatus: false,
    previousCsoundStatus: false,
    shouldRedirect: false
};

export default (state = INITIAL_STATE, action: ProfileActionTypes) => {
    switch (action.type) {
        case REFRESH_USER_PROFILE: {
            return {
                ...state,
                userProfile: action.payload
            };
        }
        case SHOULD_REDIRECT_REQUEST: {
            return {
                ...state,
                shouldRedirect: "REQUEST"
            };
        }
        case SHOULD_REDIRECT_YES: {
            return {
                ...state,
                shouldRedirect: "YES"
            };
        }
        case SHOULD_REDIRECT_NO: {
            return {
                ...state,
                shouldRedirect: "NO"
            };
        }
        case SET_CSOUND_STATUS: {
            return {
                ...state,
                previousCsoundStatus: state.csoundStatus,
                csoundStatus: action.payload
            };
        }
        case SET_CURRENTLY_PLAYING_PROJECT: {
            return {
                ...state,
                currentlyPlayingProject: action.payload
            };
        }
        case SET_LIST_PLAY_STATE: {
            return {
                ...state,
                listPlayState: action.payload
            };
        }
        case GET_TAGS: {
            return {
                ...state,
                tags: action.payload
            };
        }
        case SET_PREVIOUS_PROJECT_TAGS: {
            return {
                ...state,
                previousProjectTags: action.payload
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
