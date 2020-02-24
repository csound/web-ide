export const GET_TAGS = "HOME.GET_TAGS";
export const GET_STARS = "HOME.GET_STARS";
export const GET_PROJECT_LAST_MODIFIED = "HOME.GET_PROJECT_LAST_MODIFIED";
export const GET_DISPLAYED_STARRED_PROJECTS =
    "HOME.GET_DISPLAYED_STARRED_PROJECTS";
export const GET_DISPLAYED_RECENT_PROJECTS =
    "HOME.GET_DISPLAYED_RECENT_PROJECTS";
export const GET_FEATURED_PROJECT_USER_PROFILES =
    "HOME.GET_FEATURED_PROJECT_USER_PROFILES";
export const GET_DISPLAYED_RANDOM_PROJECTS =
    "HOME.GET_DISPLAYED_RANDOM_PROJECTS";
export const SEARCH_PROJECTS = "HOME.SEARCH_PROJECTS";
export const GET_SEARCHED_PROJECT_USER_PROFILES =
    "HOME.GET_SEARCHED_PROJECT_USER_PROFILES";
interface SearchProjects {
    type: typeof SEARCH_PROJECTS;
    payload: any;
}

interface GetFeaturedProjectUserProfiles {
    type: typeof GET_FEATURED_PROJECT_USER_PROFILES;
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
    | SearchProjects;
