import {
    HomeActionTypes,
    // GET_TAGS,
    GET_STARS,
    GET_PROJECT_LAST_MODIFIED,
    GET_DISPLAYED_STARRED_PROJECTS,
    GET_FEATURED_PROJECT_USER_PROFILES,
    GET_RANDOM_PROJECT_USER_PROFILES,
    GET_POPULAR_PROJECT_USER_PROFILES,
    GET_SEARCHED_PROJECT_USER_PROFILES,
    GET_DISPLAYED_RANDOM_PROJECTS,
    SEARCH_PROJECTS_REQUEST,
    SEARCH_PROJECTS_SUCCESS
} from "./types";
import { Timestamp } from "@config/firestore";
import { IFirestoreProject } from "@db/types";

export interface IHomeReducer {
    // readonly tags: any;
    readonly stars: Record<string, Timestamp>;
    readonly starsTotal: number;
    readonly projectLastModified: Timestamp | undefined;
    readonly displayedStarredProjects: IFirestoreProject[];
    readonly displayedRandomProjects: IFirestoreProject[];
    readonly featuredProjectUserProfiles: IFirestoreProject[];
    readonly popularProjectUserProfiles: IFirestoreProject[];
    readonly randomProjectUserProfiles: IFirestoreProject[];
    readonly searchedProjectUserProfiles: IFirestoreProject[];
    readonly searchedProjects: IFirestoreProject[];
    readonly searchedProjectsTotal: number;
    readonly searchProjectsRequest: boolean;
}

const INITIAL_STATE: IHomeReducer = {
    // tags: false,
    stars: {},
    starsTotal: 0,
    projectLastModified: undefined,
    displayedStarredProjects: [],
    displayedRandomProjects: [],
    featuredProjectUserProfiles: [],
    popularProjectUserProfiles: [],
    randomProjectUserProfiles: [],
    searchedProjectUserProfiles: [],
    searchedProjects: [],
    searchedProjectsTotal: 0,
    searchProjectsRequest: false
};

const HomeReducer = (
    state: IHomeReducer = INITIAL_STATE,
    action: HomeActionTypes
): IHomeReducer => {
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
        case GET_RANDOM_PROJECT_USER_PROFILES: {
            return {
                ...state,
                randomProjectUserProfiles: action.payload
            };
        }
        case GET_POPULAR_PROJECT_USER_PROFILES: {
            return {
                ...state,
                popularProjectUserProfiles: action.payload
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
        // case GET_DISPLAYED_RECENT_PROJECTS: {
        //     return {
        //         ...state,
        //         displayedRecentProjects: action.payload
        //     };
        // }
        case GET_PROJECT_LAST_MODIFIED: {
            return {
                ...state,
                projectLastModified: action.payload
            };
        }
        // case GET_TAGS: {
        //     return {
        //         ...state,
        //         tags: action.payload
        //     };
        // }
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

export default HomeReducer;
