export const GET_USER_PROJECTS = "PROFILE.GET_USER_PROJECTS";
export const GET_USER_PROFILE = "PROFILE.GET_USER_PROFILE";
export const ADD_USER_PROJECT = "PROFILE.ADD_USER_PROJECT";
export const DELETE_USER_PROJECT = "PROFILE.DELETE_USER_PROJECT";
export const GET_USER_IMAGE_URL = "PROFILE.GET_USER_IMAGE_URL";
export const SET_CURRENT_TAG_TEXT = "PROFILE.SET_CURRENT_TAG_TEXT";
export const SET_TAGS_INPUT = "PROFILE.SET_TAGS_INPUT";
export const SET_CURRENTLY_PLAYING_PROJECT =
    "PROFILE.SET_CURRENTLY_PLAYING_PROJECT";
export const SET_LIST_PLAY_STATE = "PROFILE.SET_LIST_PLAY_STATE";
export const GET_TAGS = "PROFILE.GET_TAGS";
export const SET_PREVIOUS_PROJECT_TAGS = "PROFILE.SET_PREVIOUS_PROJECT_TAGS";
export const SET_CSOUND_STATUS = "PROFILE.SET_CSOUND_STATUS";
interface SetCsoundStatusAction {
    type: typeof SET_CSOUND_STATUS;
    payload: string;
}

interface SetListPlayStateAction {
    type: typeof SET_LIST_PLAY_STATE;
    payload: string;
}

interface SetCurrentlyPlayingProjectAction {
    type: typeof SET_CURRENTLY_PLAYING_PROJECT;
    payload: string;
}

interface SetTagsInputAction {
    type: typeof SET_TAGS_INPUT;
    payload: any[];
}

interface SetPreviousProjectTagsAction {
    type: typeof SET_PREVIOUS_PROJECT_TAGS;
    payload: any[];
}

interface GetTagsAction {
    type: typeof GET_TAGS;
    payload: any[];
}
interface GetUserProfileAction {
    type: typeof GET_USER_PROFILE;
    payload: any;
}

interface GetUserImageURLAction {
    type: typeof GET_USER_IMAGE_URL;
    payload: string;
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

interface SetCurrentTagTextAction {
    type: typeof SET_CURRENT_TAG_TEXT;
    payload: string;
}

export type ProfileActionTypes =
    | GetUserProfileAction
    | GetUserProjectsAction
    | AddUserProjectAction
    | DeleteUserProjectAction
    | GetUserImageURLAction
    | SetCurrentTagTextAction
    | SetTagsInputAction
    | GetTagsAction
    | SetListPlayStateAction
    | SetCurrentlyPlayingProjectAction
    | SetPreviousProjectTagsAction
    | SetCsoundStatusAction;
