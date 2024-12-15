import {
    HomeActionTypes,
    ADD_USER_PROFILES,
    SEARCH_PROJECTS_REQUEST,
    SEARCH_PROJECTS_SUCCESS,
    ADD_POPULAR_PROJECTS,
    ADD_RANDOM_PROJECTS,
    SET_POPULAR_PROJECTS_OFFSET,
    SET_RANDOM_PROJECTS_LOADING
} from "./types";
import { IProject } from "@comp/projects/types";
import { IProfile } from "@comp/profile/types";
import { RandomProjectResponse, PopularProjectResponse } from "./types";

export interface IHomeReducer {
    popularProjects: PopularProjectResponse[];
    popularProjectsOffset: number;
    profiles: { [uid: string]: IProfile };
    searchProjectsRequest: boolean;
    searchResult: IProject[];
    searchResultTotalRecords: number;
    searchPaginationOffset: number;
    searchQuery: string;
    randomProjects: RandomProjectResponse[];
    randomProjectsLoading: boolean;
}

const INITIAL_STATE: IHomeReducer = {
    popularProjects: [],
    popularProjectsOffset: -1,
    profiles: {},
    searchProjectsRequest: false,
    searchResult: [],
    searchResultTotalRecords: -1,
    searchPaginationOffset: -1,
    searchQuery: "",
    randomProjects: [],
    randomProjectsLoading: true
};

const HomeReducer = (
    state: IHomeReducer = INITIAL_STATE,
    action: HomeActionTypes
): IHomeReducer => {
    switch (action.type) {
        case SEARCH_PROJECTS_REQUEST: {
            const newState = { ...state };
            newState.searchProjectsRequest = action.query.length > 0;
            newState.searchQuery = action.query;
            newState.searchPaginationOffset =
                action.query.length === 0 ? -1 : action.offset;
            if (action.query.length === 0) {
                newState.searchResultTotalRecords = -1;
            }
            return newState;
        }
        case SEARCH_PROJECTS_SUCCESS: {
            return {
                ...state,
                searchResult: action.result || [],
                searchProjectsRequest: false,
                searchResultTotalRecords: action.totalRecords
            };
        }
        case ADD_USER_PROFILES: {
            return {
                ...state,
                profiles: {
                    ...state.profiles,
                    ...action.payload
                }
            };
        }
        case ADD_POPULAR_PROJECTS: {
            return {
                ...state,
                popularProjects: [...state.popularProjects, ...action.payload]
            };
        }
        case SET_POPULAR_PROJECTS_OFFSET: {
            return {
                ...state,
                popularProjectsOffset: action.newOffset
            };
        }
        case ADD_RANDOM_PROJECTS: {
            return {
                ...state,
                randomProjects: action.payload || []
            };
        }
        case SET_RANDOM_PROJECTS_LOADING: {
            return {
                ...state,
                randomProjectsLoading: action.isLoading
            };
        }
        default: {
            return state;
        }
    }
};

export default HomeReducer;
