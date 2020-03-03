import {
    HomeActionTypes,
    GET_TAGS,
    GET_STARS,
    GET_PROJECT_LAST_MODIFIED,
    GET_DISPLAYED_RECENT_PROJECTS,
    GET_DISPLAYED_STARRED_PROJECTS,
    GET_FEATURED_PROJECT_USER_PROFILES,
    GET_SEARCHED_PROJECT_USER_PROFILES,
    GET_DISPLAYED_RANDOM_PROJECTS,
    SEARCH_PROJECTS_REQUEST,
    SEARCH_PROJECTS_SUCCESS
} from "./types";

export interface State {
    readonly tags: any;
    readonly stars: any;
    readonly starsTotal: number;
    readonly projectLastModified: any;
    readonly displayedStarredProjects: any;
    readonly displayedRandomProjects: any;
    readonly featuredProjectUserProfiles: any;
    readonly searchedProjectUserProfiles: any;
    readonly searchedProjects: any;
    readonly searchedProjectsTotal: any;
    readonly searchProjectsRequest: boolean;
}

const INITIAL_STATE: State = {
    tags: false,
    stars: false,
    starsTotal: 0,
    projectLastModified: false,
    displayedStarredProjects: false,
    displayedRandomProjects: false,
    featuredProjectUserProfiles: false,
    searchedProjectUserProfiles: false,
    searchedProjects: false,
    searchedProjectsTotal: 0,
    searchProjectsRequest: false
};

export default (state = INITIAL_STATE, action: HomeActionTypes) => {
    switch (action.type) {
        case SEARCH_PROJECTS_REQUEST: {
            return {
                ...state,
                searchProjectsRequest: true
            };
        }
        case SEARCH_PROJECTS_SUCCESS: {
            return {
                ...state,
                searchedProjects: action.payload.data || false,
                searchedProjectsTotal: action.payload.totalRecords || 0,
                searchProjectsRequest: false
            };
        }
        case GET_FEATURED_PROJECT_USER_PROFILES: {
            return {
                ...state,
                featuredProjectUserProfiles: action.payload
            };
        }
        case GET_SEARCHED_PROJECT_USER_PROFILES: {
            return {
                ...state,
                searchedProjectUserProfiles: action.payload
            };
        }
        case GET_DISPLAYED_STARRED_PROJECTS: {
            return {
                ...state,
                displayedStarredProjects: action.payload
            };
        }
        case GET_DISPLAYED_RANDOM_PROJECTS: {
            return {
                ...state,
                displayedRandomProjects: action.payload
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
                stars: action.payload.data,
                starsTotal: action.payload.totalRecords
            };
        }
        default: {
            return state;
        }
    }
};
