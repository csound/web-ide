import {
    ProfileActionTypes,
    GET_USER_PROFILE,
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
    REFRESH_USER_PROFILE,
    UPDATE_LOGGED_IN_FOLLOWING,
    UPDATE_PROFILE_FOLLOWING,
    SET_IMAGE_URL_REQUESTING,
    SET_PROFILE_REQUESTING,
    SET_FOLLOWING_FILTER_STRING,
    SET_PROJECT_FILTER_STRING,
    SET_STAR_PROJECT_REQUESTING,
    GET_LOGGED_IN_USER_STARS
} from "./types";
import facePng from "./face.png";
export interface State {
    readonly userProjects: any;
    readonly userProfile: any;
    readonly userProfileRequesting: boolean;
    readonly userImageURL: string | null | undefined;
    readonly userImageURLRequesting: boolean;
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
    readonly userFollowing: [];
    readonly loggedInUserFollowing: [];
    readonly userProfilesForFollowing: [];
    readonly projectFilterString: string;
    readonly followingFilterString: string;
    readonly starProjectRequesting: string[];
    readonly loggedInUserStars: string[];
}

const INITIAL_STATE: State = {
    userProjects: false,
    userProfile: false,
    userProfileRequesting: false,
    userImageURL: facePng,
    userImageURLRequesting: false,
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
    shouldRedirect: false,
    userFollowing: [],
    loggedInUserFollowing: [],
    userProfilesForFollowing: [],
    projectFilterString: "",
    followingFilterString: "",
    starProjectRequesting: [],
    loggedInUserStars: []
};

export default (state = INITIAL_STATE, action: ProfileActionTypes) => {
    switch (action.type) {
        case GET_LOGGED_IN_USER_STARS: {
            return {
                ...state,
                loggedInUserStars: [...action.payload]
            };
        }
        case SET_STAR_PROJECT_REQUESTING: {
            return {
                ...state,
                starProjectRequesting: action.payload
            };
        }
        case SET_FOLLOWING_FILTER_STRING: {
            return {
                ...state,
                followingFilterString: action.payload
            };
        }
        case SET_PROJECT_FILTER_STRING: {
            return {
                ...state,
                projectFilterString: action.payload
            };
        }
        case SET_PROFILE_REQUESTING: {
            return {
                ...state,
                userProfileRequesting: action.payload
            };
        }
        case SET_IMAGE_URL_REQUESTING: {
            return {
                ...state,
                userImageURLRequesting: action.payload
            };
        }
        case UPDATE_PROFILE_FOLLOWING: {
            return {
                ...state,
                userFollowing: action.userProfileUids,
                userProfilesForFollowing: action.userProfiles
            };
        }
        case UPDATE_LOGGED_IN_FOLLOWING: {
            return {
                ...state,
                loggedInUserFollowing: action.userProfileUids
            };
        }
        case REFRESH_USER_PROFILE: {
            return {
                ...state,
                userProfile: { ...state.userProfile, ...action.payload }
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
        case GET_USER_PROFILE: {
            return {
                ...state,
                userProfile: action.payload.profile,
                profileUid: action.payload.profileUid,
                loggedInUid: action.payload.loggedInUid,
                userImageURL: action.payload.profile.photoUrl || facePng
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
