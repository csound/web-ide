import {
    HomeActionTypes,
    ADD_USER_PROFILES,
    SEARCH_PROJECTS_REQUEST,
    SEARCH_PROJECTS_SUCCESS,
    ADD_POPULAR_ARTISTS,
    ADD_POPULAR_PROJECTS,
    ADD_RANDOM_PROJECTS,
    SET_POPULAR_PROJECTS_LOADING,
    SET_POPULAR_PROJECTS_ERROR,
    SET_POPULAR_ARTISTS_ERROR,
    SET_RANDOM_PROJECTS_LOADING,
    SET_POPULAR_ARTISTS_LOADING,
    AddPopularArtistsAction,
    AddPopularProjectsAction,
    AddUserProfiles,
    AddRandomProjectsAction,
    SetPopularArtistsLoading,
    SetPopularProjectsLoading,
    SetPopularRankingError,
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
    popularProjectsLoading: boolean;
    popularProjectsError: string | null;
    popularArtistsError: string | null;
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
    popularProjectsLoading: true,
    popularProjectsError: null,
    popularArtistsError: null,
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
                popularProjects: action.payload || []
            };
        }
        case SET_POPULAR_PROJECTS_LOADING: {
            const action = unknownAction as SetPopularProjectsLoading;
            return {
                ...state,
                popularProjectsLoading: action.isLoading,
                popularProjectsError: action.isLoading
                    ? null
                    : state.popularProjectsError
            };
        }
        case SET_POPULAR_PROJECTS_ERROR:
        case SET_POPULAR_ARTISTS_ERROR: {
            const action = unknownAction as SetPopularRankingError;
            return {
                ...state,
                [action.type === SET_POPULAR_PROJECTS_ERROR
                    ? "popularProjectsError"
                    : "popularArtistsError"]: action.error
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
                popularArtistsLoading: action.isLoading,
                popularArtistsError: action.isLoading
                    ? null
                    : state.popularArtistsError
            };
        }
        default: {
            return state;
        }
    }
};

export default HomeReducer;
