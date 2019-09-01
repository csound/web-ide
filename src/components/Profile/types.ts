export const GET_USER_PROJECTS = "PROFILE.GET_USER_PROJECTS";
export const GET_USER_PROFILE = "PROFILE.GET_USER_PROFILE";
export const ADD_USER_PROJECT = "PROFILE.ADD_USER_PROJECT";
export const DELETE_USER_PROJECT = "PROFILE.DELETE_USER_PROJECT";

interface GetUserProfileAction {
    type: typeof GET_USER_PROFILE;
    payload: any;
}

interface GetUserProjectsAction {
    type: typeof GET_USER_PROJECTS;
    payload: any;
}

interface AddUserProjectAction {
    type: typeof ADD_USER_PROJECT;
}

interface DeleteUserProjectAction {
    type: typeof DELETE_USER_PROJECT;
}

export type ProfileActionTypes =
    | GetUserProfileAction
    | GetUserProjectsAction
    | AddUserProjectAction
    | DeleteUserProjectAction;
