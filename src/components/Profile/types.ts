export const GET_USER_PROFILE = "PROFILE.GET_USER_PROFILE";
export const ADD_USER_PROJECT = "PROFILE.ADD_USER_PROJECT";
export const DELETE_USER_PROJECT = "PROFILE.DELETE_USER_PROJECT";
export const SET_IMAGE_URL_REQUESTING = "PROFILE.SET_IMAGE_URL_REQUESTING";
export const SET_PROFILE_REQUESTING = "PROFILE.SET_PROFILE_REQUESTING";
export const SET_CURRENT_TAG_TEXT = "PROFILE.SET_CURRENT_TAG_TEXT";
export const SET_TAGS_INPUT = "PROFILE.SET_TAGS_INPUT";
export const SET_USER_PROFILE = "PROFILE.SET_USER_PROFILE";
export const SET_FOLLOWING_FILTER_STRING =
    "PROFILE.SET_FOLLOWING_FILTER_STRING";
export const SET_PROJECT_FILTER_STRING = "PROFILE.SET_PROJECT_FILTER_STRING";
export const SET_CURRENTLY_PLAYING_PROJECT =
    "PROFILE.SET_CURRENTLY_PLAYING_PROJECT";
export const SET_LIST_PLAY_STATE = "PROFILE.SET_LIST_PLAY_STATE";
export const GET_TAGS = "PROFILE.GET_TAGS";
export const SET_PREVIOUS_PROJECT_TAGS = "PROFILE.SET_PREVIOUS_PROJECT_TAGS";
export const SET_CSOUND_STATUS = "PROFILE.SET_CSOUND_STATUS";
export const SHOULD_REDIRECT_REQUEST = "PROFILE.SHOULD_REDIRECT_REQUEST";
export const SHOULD_REDIRECT_YES = "PROFILE.SHOULD_REDIRECT_YES";
export const SHOULD_REDIRECT_NO = "PROFILE.SHOULD_REDIRECT_NO";
export const REFRESH_USER_PROFILE = "PROFILE.REFRESH_USER_PROFILE";
export const UPDATE_LOGGED_IN_FOLLOWING = "PROFILE.UPDATE_LOGGED_IN_FOLLOWING";
export const UPDATE_PROFILE_FOLLOWING = "PROFILE.UPDATE_PROFILE_FOLLOWING";
export const GET_USER_PROFILES_FOR_FOLLOWING =
    "PROFILE.GET_USER_PROFILES_FOR_FOLLOWING";
export const SET_STAR_PROJECT_REQUESTING =
    "PROFILE.SET_STAR_PROJECT_REQUESTING";
export const GET_LOGGED_IN_USER_STARS = "PROFILE.GET_LOGGED_IN_USER_STARS";

interface GetLoggedInUserStarsAction {
    type: typeof GET_LOGGED_IN_USER_STARS;
    payload: string[];
}
interface SetStarProjectRequestingAction {
    type: typeof SET_STAR_PROJECT_REQUESTING;
    payload: boolean;
}

interface SetFollowingFilterStringAction {
    type: typeof SET_FOLLOWING_FILTER_STRING;
    payload: string;
}

interface SetProjectFilterStringAction {
    type: typeof SET_PROJECT_FILTER_STRING;
    payload: string;
}
interface SetProfileRequestingAction {
    type: typeof SET_PROFILE_REQUESTING;
    payload: boolean;
}
interface SetImageURLRequestingAction {
    type: typeof SET_IMAGE_URL_REQUESTING;
    payload: boolean;
}
interface UpdateProfileFollowingAction {
    type: typeof UPDATE_PROFILE_FOLLOWING;
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

interface SetShouldRedirectRequestAction {
    type: typeof SHOULD_REDIRECT_REQUEST;
}

interface RefreshUserProfileAction {
    type: typeof REFRESH_USER_PROFILE;
    payload: any;
}

interface SetUserProfileAction {
    type: typeof SET_USER_PROFILE;
}
interface SetShouldRedirectYesAction {
    type: typeof SHOULD_REDIRECT_YES;
}

interface SetShouldRedirectNoAction {
    type: typeof SHOULD_REDIRECT_NO;
}
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
    | AddUserProjectAction
    | DeleteUserProjectAction
    | SetCurrentTagTextAction
    | SetTagsInputAction
    | GetTagsAction
    | SetListPlayStateAction
    | SetCurrentlyPlayingProjectAction
    | SetPreviousProjectTagsAction
    | SetCsoundStatusAction
    | SetShouldRedirectYesAction
    | SetShouldRedirectNoAction
    | GetUserProfilesForFollowingAction
    | SetUserProfileAction
    | UpdateLoggedInFollowingAction
    | UpdateProfileFollowingAction
    | RefreshUserProfileAction
    | SetImageURLRequestingAction
    | SetProfileRequestingAction
    | SetFollowingFilterStringAction
    | SetProjectFilterStringAction
    | SetShouldRedirectRequestAction
    | SetStarProjectRequestingAction
    | GetLoggedInUserStarsAction;
