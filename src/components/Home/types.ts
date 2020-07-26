export const GET_TAGS = "HOME.GET_TAGS";
export const GET_STARS = "HOME.GET_STARS";
export const GET_PROJECT_LAST_MODIFIED = "HOME.GET_PROJECT_LAST_MODIFIED";
export const GET_DISPLAYED_STARRED_PROJECTS =
    "HOME.GET_DISPLAYED_STARRED_PROJECTS";
export const GET_DISPLAYED_RECENT_PROJECTS =
    "HOME.GET_DISPLAYED_RECENT_PROJECTS";
export const GET_FEATURED_PROJECT_USER_PROFILES =
    "HOME.GET_FEATURED_PROJECT_USER_PROFILES";
export const GET_RANDOM_PROJECT_USER_PROFILES =
    "HOME.GET_RANDOM_PROJECT_USER_PROFILES";
export const GET_POPULAR_PROJECT_USER_PROFILES =
    "HOME.GET_POPULAR_PROJECT_USER_PROFILES";
export const GET_DISPLAYED_RANDOM_PROJECTS =
    "HOME.GET_DISPLAYED_RANDOM_PROJECTS";
export const SEARCH_PROJECTS_REQUEST = "HOME.SEARCH_PROJECTS_REQUEST";
export const SEARCH_PROJECTS_SUCCESS = "HOME.SEARCH_PROJECTS_SUCCESS";

export const GET_SEARCHED_PROJECT_USER_PROFILES =
    "HOME.GET_SEARCHED_PROJECT_USER_PROFILES";
interface SearchProjectsRequest {
    type: typeof SEARCH_PROJECTS_REQUEST;
    payload: any;
}

interface SearchProjectsSuccess {
    type: typeof SEARCH_PROJECTS_SUCCESS;
    payload: any;
}

interface GetFeaturedProjectUserProfiles {
    type: typeof GET_FEATURED_PROJECT_USER_PROFILES;
    payload: any;
}

interface GetRandomProjectUserProfiles {
    type: typeof GET_RANDOM_PROJECT_USER_PROFILES;
    payload: any;
}

interface GetPopularProjectUserProfiles {
    type: typeof GET_POPULAR_PROJECT_USER_PROFILES;
    payload: any;
}

interface GetSearchedProjectUserProfiles {
    type: typeof GET_SEARCHED_PROJECT_USER_PROFILES;
    payload: any;
}

interface GetDisplayedStarredProjects {
    type: typeof GET_DISPLAYED_STARRED_PROJECTS;
    payload: any;
}

interface GetDisplayedRecentProjects {
    type: typeof GET_DISPLAYED_RECENT_PROJECTS;
    payload: any;
}

interface GetDisplayedRandomProjects {
    type: typeof GET_DISPLAYED_RANDOM_PROJECTS;
    payload: any;
}
interface GetProjectLastModified {
    type: typeof GET_PROJECT_LAST_MODIFIED;
    payload: any;
}
interface GetTagsAction {
    type: typeof GET_TAGS;
    payload: any;
}

interface GetStarsAction {
    type: typeof GET_STARS;
    payload: any;
}

export type HomeActionTypes =
    | GetTagsAction
    | GetStarsAction
    | GetProjectLastModified
    | GetDisplayedStarredProjects
    | GetDisplayedRecentProjects
    | GetDisplayedRandomProjects
    | GetSearchedProjectUserProfiles
    | GetFeaturedProjectUserProfiles
    | SearchProjectsRequest
    | SearchProjectsSuccess
    | GetRandomProjectUserProfiles
    | GetPopularProjectUserProfiles;
