import { IProject } from "@comp/projects/types";
import { Timestamp } from "firebase/firestore";
import { UnknownAction } from "redux";

export const SEARCH_PROJECTS_REQUEST = "HOME.SEARCH_PROJECTS_REQUEST";
export const SEARCH_PROJECTS_SUCCESS = "HOME.SEARCH_PROJECTS_SUCCESS";

export const ADD_USER_PROFILES = "HOME.ADD_USER_PROFILES";
export const ADD_RANDOM_PROJECTS = "HOME.ADD_RANDOM_PROJECTS";
export const ADD_POPULAR_PROJECTS = "HOME.ADD_POPULAR_PROJECTS";
export const ADD_POPULAR_ARTISTS = "HOME.ADD_POPULAR_ARTISTS";
export const SET_POPULAR_PROJECTS_OFFSET = "HOME.SET_POPULAR_PROJECTS_OFFSET";
export const SET_RANDOM_PROJECTS_LOADING = "HOME.SET_RANDOM_PROJECTS_LOADING";
export const SET_POPULAR_ARTISTS_LOADING = "HOME.SET_POPULAR_ARTISTS_LOADING";

export interface RandomProjectResponse {
    created: Timestamp;
    description: string;
    iconBackgroundColor: string | undefined;
    iconForegroundColor: string | undefined;
    iconName: string | undefined;
    name: string;
    projectUid: string;
    public: boolean;
    userUid: string;
}

export interface PopularProjectResponse {
    created: Timestamp;
    description: string;
    iconBackgroundColor: string | undefined;
    iconForegroundColor: string | undefined;
    iconName: string | undefined;
    name: string;
    projectUid: string;
    public: boolean;
    userUid: string;
}

export interface PopularArtistResponse {
    userUid: string;
    totalStars: number;
    projectCount: number;
}

export interface SearchProjectsRequest {
    type: typeof SEARCH_PROJECTS_REQUEST;
    query: string;
    offset: number;
}

export interface SearchProjectsSuccess {
    type: typeof SEARCH_PROJECTS_SUCCESS;
    result: IProject[];
    totalRecords: number;
}

export interface AddUserProfiles {
    type: typeof ADD_USER_PROFILES;
    payload: any;
}

export interface AddPopularProjectsAction {
    type: typeof ADD_POPULAR_PROJECTS;
    payload: PopularProjectResponse[];
}

export interface SetPopularProjectsOffsetAction {
    type: typeof SET_POPULAR_PROJECTS_OFFSET;
    newOffset: number;
}

export interface AddRandomProjectsAction {
    type: typeof ADD_RANDOM_PROJECTS;
    payload: RandomProjectResponse[];
}

export interface SetRandomProjectsLoading {
    type: typeof SET_RANDOM_PROJECTS_LOADING;
    isLoading: boolean;
}

export interface AddPopularArtistsAction {
    type: typeof ADD_POPULAR_ARTISTS;
    payload: PopularArtistResponse[];
}

export interface SetPopularArtistsLoading {
    type: typeof SET_POPULAR_ARTISTS_LOADING;
    isLoading: boolean;
}

export type HomeActionTypes =
    | UnknownAction
    | SearchProjectsRequest
    | SearchProjectsSuccess
    | AddUserProfiles
    | AddPopularArtistsAction
    | AddPopularProjectsAction
    | AddRandomProjectsAction
    | SetPopularProjectsOffsetAction
    | SetRandomProjectsLoading
    | SetPopularArtistsLoading;
