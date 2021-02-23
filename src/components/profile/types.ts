import { SET_CSOUND_PLAY_STATE } from "@comp/csound/types";

export const STORE_USER_PROFILE = "PROFILE.STORE_USER_PROFILE";
export const STORE_PROFILE_PROJECTS_COUNT =
    "PROFILE.STORE_PROFILE_PROJECTS_COUNT";
export const STORE_PROFILE_STARS = "PROFILE.STORE_PROFILE_STARS";
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
export const CLOSE_CURRENTLY_PLAYING_PROJECT =
    "PROFILE.CLOSE_CURRENTLY_PLAYING_PROJECT";
export const SET_LIST_PLAY_STATE = "PROFILE.SET_LIST_PLAY_STATE";
export const GET_ALL_TAGS = "PROFILE.GET_ALL_TAGS";
export const REFRESH_USER_PROFILE = "PROFILE.REFRESH_USER_PROFILE";
export const UPDATE_LOGGED_IN_FOLLOWING = "PROFILE.UPDATE_LOGGED_IN_FOLLOWING";
export const UPDATE_PROFILE_FOLLOWING = "PROFILE.UPDATE_PROFILE_FOLLOWING";
export const UPDATE_PROFILE_FOLLOWERS = "PROFILE.UPDATE_PROFILE_FOLLOWERS";
export const GET_USER_PROFILES_FOR_FOLLOWING =
    "PROFILE.GET_USER_PROFILES_FOR_FOLLOWING";

type ProfileActionTypeValue =
    | typeof SET_CURRENT_TAG_TEXT
    | typeof DELETE_USER_PROJECT
    | typeof ADD_USER_PROJECT
    | typeof STORE_USER_PROFILE
    | typeof GET_ALL_TAGS
    | typeof SET_TAGS_INPUT
    | typeof SET_CSOUND_PLAY_STATE
    | typeof SET_CURRENTLY_PLAYING_PROJECT
    | typeof CLOSE_CURRENTLY_PLAYING_PROJECT
    | typeof SET_LIST_PLAY_STATE
    | typeof SET_USER_PROFILE
    | typeof REFRESH_USER_PROFILE
    | typeof GET_USER_PROFILES_FOR_FOLLOWING
    | typeof UPDATE_LOGGED_IN_FOLLOWING
    | typeof UPDATE_PROFILE_FOLLOWING
    | typeof SET_PROJECT_FILTER_STRING
    | typeof SET_FOLLOWING_FILTER_STRING;

export type ProjectsCount = {
    all: number;
    public: number;
};

export type ProfileActionTypes = {
    type: ProfileActionTypeValue;
    [payload: string]: any;
};

export interface IProfile {
    allTags?: any[];
    bio?: string;
    profileUid?: string;
    userFollowing?: [];
    projectsCount?: ProjectsCount;
    userImageURL?: string;
    backgroundIndex: number;
    displayName: string;
    username: string;
    photoUrl?: string;
}
