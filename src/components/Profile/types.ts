export const GET_USER_PROJECTS = "PROFILE.GET_USER_PROJECTS";
export const ADD_USER_PROJECT = "PROFILE.ADD_USER_PROJECT";
export const DELETE_USER_PROJECT = "PROFILE.DELETE_USER_PROJECT";
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
    | GetUserProjectsAction
    | AddUserProjectAction
    | DeleteUserProjectAction;
