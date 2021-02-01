import { IProject } from "@comp/projects/types";

export const SEARCH_PROJECTS_REQUEST = "HOME.SEARCH_PROJECTS_REQUEST";
export const SEARCH_PROJECTS_SUCCESS = "HOME.SEARCH_PROJECTS_SUCCESS";

export const ADD_USER_PROFILES = "HOME.ADD_USER_PROFILES";
export const FETCH_POPULAR_PROJECTS = "HOME.FETCH_POPULAR_PROJECTS";
export const SET_POPULAR_PROJECTS_OFFSET = "HOME.SET_POPULAR_PROJECTS_OFFSET";

interface SearchProjectsRequest {
    type: typeof SEARCH_PROJECTS_REQUEST;
    query: string;
    offset: number;
}

interface SearchProjectsSuccess {
    type: typeof SEARCH_PROJECTS_SUCCESS;
    result: IProject[];
    totalRecords: number;
}

interface AddUserProfiles {
    type: typeof ADD_USER_PROFILES;
    payload: any;
}

interface FetchPopularProjectsAction {
    type: typeof FETCH_POPULAR_PROJECTS;
    payload: IProject[];
    totalRecords: number;
}

interface SetPopularProjectsOffsetAction {
    type: typeof SET_POPULAR_PROJECTS_OFFSET;
    newOffset: number;
}

export type HomeActionTypes =
    | SearchProjectsRequest
    | SearchProjectsSuccess
    | AddUserProfiles
    | FetchPopularProjectsAction
    | SetPopularProjectsOffsetAction;
