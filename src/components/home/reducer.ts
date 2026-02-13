import {
    HomeActionTypes,
    ADD_USER_PROFILES,
    SEARCH_PROJECTS_REQUEST,
    SEARCH_PROJECTS_SUCCESS,
    ADD_POPULAR_ARTISTS,
    ADD_POPULAR_PROJECTS,
    ADD_RANDOM_PROJECTS,
    SET_POPULAR_PROJECTS_OFFSET,
    SET_RANDOM_PROJECTS_LOADING,
    SET_POPULAR_ARTISTS_LOADING,
    AddPopularArtistsAction,
    AddPopularProjectsAction,
    AddUserProfiles,
    AddRandomProjectsAction,
    SetPopularArtistsLoading,
    SetPopularProjectsOffsetAction,
    SetRandomProjectsLoading,
    SearchProjectsRequest,
    SearchProjectsSuccess
} from "./types";
import { IProject } from "@comp/projects/types";
import { IProfile } from "@comp/profile/types";
import {
    RandomProjectResponse,
    PopularArtistResponse,
    PopularProjectResponse
} from "./types";

export interface IHomeReducer {
    popularArtists: PopularArtistResponse[];
    popularArtistsLoading: boolean;
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
    popularArtists: [],
    popularArtistsLoading: true,
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
    state: IHomeReducer | undefined,
    unknownAction: HomeActionTypes
): IHomeReducer => {
    if (!state) {
        return INITIAL_STATE;
    }

    switch (unknownAction.type) {
        case SEARCH_PROJECTS_REQUEST: {
            const newState: IHomeReducer = { ...state };
            const action = unknownAction as SearchProjectsRequest;
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
            const action = unknownAction as SearchProjectsSuccess;
            return {
                ...state,
                searchResult: action.result || [],
                searchProjectsRequest: false,
                searchResultTotalRecords: action.totalRecords
            };
        }
        case ADD_USER_PROFILES: {
            const action = unknownAction as AddUserProfiles;
            return {
                ...state,
                profiles: {
                    ...state.profiles,
                    ...action.payload
                }
            };
        }
        case ADD_POPULAR_ARTISTS: {
            const action = unknownAction as AddPopularArtistsAction;
            return {
                ...state,
                popularArtists: action.payload || []
            };
        }
        case ADD_POPULAR_PROJECTS: {
            const action = unknownAction as AddPopularProjectsAction;
            return {
                ...state,
                popularProjects: [...state.popularProjects, ...action.payload]
            };
        }
        case SET_POPULAR_PROJECTS_OFFSET: {
            const action = unknownAction as SetPopularProjectsOffsetAction;
            return {
                ...state,
                popularProjectsOffset: action.newOffset
            };
        }
        case ADD_RANDOM_PROJECTS: {
            const action = unknownAction as AddRandomProjectsAction;
            return {
                ...state,
                randomProjects: action.payload || []
            };
        }
        case SET_RANDOM_PROJECTS_LOADING: {
            const action = unknownAction as SetRandomProjectsLoading;
            return {
                ...state,
                randomProjectsLoading: action.isLoading
            };
        }
        case SET_POPULAR_ARTISTS_LOADING: {
            const action = unknownAction as SetPopularArtistsLoading;
            return {
                ...state,
                popularArtistsLoading: action.isLoading
            };
        }
        default: {
            return state;
        }
    }
};

export default HomeReducer;
