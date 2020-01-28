import {
    HomeActionTypes,
    GET_TAGS,
    GET_STARS,
    GET_PROJECT_LAST_MODIFIED,
    GET_DISPLAYED_RECENT_PROJECTS,
    GET_DISPLAYED_STARRED_PROJECTS,
    GET_PROJECT_USER_PROFILES
} from "./types";

export interface State {
    readonly tags: any;
    readonly stars: any;
    readonly projectLastModified: any;
    readonly displayedStarredProjects: any;
    readonly displayedRecentProjects: any;
    readonly projectUserProfiles: any;
}

const INITIAL_STATE: State = {
    tags: false,
    stars: false,
    projectLastModified: false,
    displayedStarredProjects: false,
    displayedRecentProjects: false,
    projectUserProfiles: false
};

export default (state = INITIAL_STATE, action: HomeActionTypes) => {
    switch (action.type) {
        case GET_PROJECT_USER_PROFILES: {
            return {
                ...state,
                projectUserProfiles: action.payload
            };
        }
        case GET_DISPLAYED_STARRED_PROJECTS: {
            return {
                ...state,
                displayedStarredProjects: action.payload
            };
        }
        case GET_DISPLAYED_RECENT_PROJECTS: {
            return {
                ...state,
                displayedRecentProjects: action.payload
            };
        }
        case GET_PROJECT_LAST_MODIFIED: {
            return {
                ...state,
                projectLastModified: action.payload
            };
        }
        case GET_TAGS: {
            return {
                ...state,
                tags: action.payload
            };
        }
        case GET_STARS: {
            return {
                ...state,
                stars: action.payload
            };
        }
        default: {
            return state;
        }
    }
};
