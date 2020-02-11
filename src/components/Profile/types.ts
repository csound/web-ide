export const STORE_USER_PROFILE = "PROFILE.STORE_USER_PROFILE";
export const ADD_USER_PROJECT = "PROFILE.ADD_USER_PROJECT";
export const DELETE_USER_PROJECT = "PROFILE.DELETE_USER_PROJECT";
export const SET_CURRENT_TAG_TEXT = "PROFILE.SET_CURRENT_TAG_TEXT";
export const SET_TAGS_INPUT = "PROFILE.SET_TAGS_INPUT";
export const SET_USER_PROFILE = "PROFILE.SET_USER_PROFILE";
export const SET_FOLLOWING_FILTER_STRING =
    "PROFILE.SET_FOLLOWING_FILTER_STRING";
export const SET_PROJECT_FILTER_STRING = "PROFILE.SET_PROJECT_FILTER_STRING";
export const SET_CURRENTLY_PLAYING_PROJECT =
    "PROFILE.SET_CURRENTLY_PLAYING_PROJECT";
export const SET_LIST_PLAY_STATE = "PROFILE.SET_LIST_PLAY_STATE";
export const GET_ALL_TAGS = "PROFILE.GET_ALL_TAGS";
export const REFRESH_USER_PROFILE = "PROFILE.REFRESH_USER_PROFILE";
export const UPDATE_LOGGED_IN_FOLLOWING = "PROFILE.UPDATE_LOGGED_IN_FOLLOWING";
export const UPDATE_PROFILE_FOLLOWING = "PROFILE.UPDATE_PROFILE_FOLLOWING";
export const GET_USER_PROFILES_FOR_FOLLOWING =
    "PROFILE.GET_USER_PROFILES_FOR_FOLLOWING";

interface SetFollowingFilterStringAction {
    type: typeof SET_FOLLOWING_FILTER_STRING;
    payload: string;
}

interface SetProjectFilterStringAction {
    type: typeof SET_PROJECT_FILTER_STRING;
    payload: string;
}

interface UpdateProfileFollowingAction {
    type: typeof UPDATE_PROFILE_FOLLOWING;
    profileUid: string;
    userProfiles: any[];
    userProfileUids: string[];
}
interface UpdateLoggedInFollowingAction {
    type: typeof UPDATE_LOGGED_IN_FOLLOWING;
    userProfileUids: string[];
}
interface GetUserProfilesForFollowingAction {
    type: typeof GET_USER_PROFILES_FOR_FOLLOWING;
    payload: [];
}

interface RefreshUserProfileAction {
    type: typeof REFRESH_USER_PROFILE;
    payload: any;
}

interface SetUserProfileAction {
    type: typeof SET_USER_PROFILE;
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

interface GetAllTagsAction {
    type: typeof GET_ALL_TAGS;
    loggedInUserUid: string;
    allTags: string[];
}
interface StoreUserProfileAction {
    type: typeof STORE_USER_PROFILE;
    profile: any;
    profileUid: string;
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

export interface IProfile {
    readonly allTags: any[];
    readonly profileUid: string | null;
    readonly userFollowing: [];
    readonly userImageURL: string | null | undefined;
}

export type ProfileActionTypes =
    | StoreUserProfileAction
    | AddUserProjectAction
    | DeleteUserProjectAction
    | SetCurrentTagTextAction
    | SetTagsInputAction
    | GetAllTagsAction
    | SetListPlayStateAction
    | SetCurrentlyPlayingProjectAction
    | GetUserProfilesForFollowingAction
    | SetUserProfileAction
    | UpdateLoggedInFollowingAction
    | UpdateProfileFollowingAction
    | RefreshUserProfileAction
    | SetFollowingFilterStringAction
    | SetProjectFilterStringAction;
