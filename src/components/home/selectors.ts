import { State } from "./reducer";
import { createSelector } from "reselect";

export const selectDisplayedStarredProjects = (store: any) => {
    const state: State = store.HomeReducer;
    const displayedStarredProjects = state.displayedStarredProjects;
    return !displayedStarredProjects ? new Array(8) : displayedStarredProjects;
};

export const selectSearchProjectsRequest = (store: any) => {
    const state: State = store.HomeReducer;
    const request = state.searchProjectsRequest;
    return request;
};

export const selectSearchedProjects = (store: any) => {
    const state: State = store.HomeReducer;
    const searchedProjects = state.searchedProjects;
    return searchedProjects;
};

export const selectSearchedProjectsTotal = (store: any) => {
    const state: State = store.HomeReducer;
    const searchedProjectsTotal = state.searchedProjectsTotal;
    return searchedProjectsTotal;
};

export const selectDisplayedRandomProjects = (store: any) => {
    const state: State = store.HomeReducer;
    const { displayedRandomProjects } = state;
    return !displayedRandomProjects ? new Array(4) : displayedRandomProjects;
};

export const selectTags = (store: any) => {
    const state: State = store.HomeReducer;
    return state.tags;
};

export const selectStars = (store: any) => {
    const state: State = store.HomeReducer;
    return state.stars;
};

export const selectProjectLastModified = (store: any) => {
    const state: State = store.HomeReducer;
    return state.projectLastModified;
};

export const selectFeaturedProjectUserProfiles = (store: any) => {
    const state: State = store.HomeReducer;
    return state.featuredProjectUserProfiles;
};

export const selectRandomProjectUserProfiles = (store: any) => {
    const state: State = store.HomeReducer;
    return state.randomProjectUserProfiles;
};

export const selectPopularProjectUserProfiles = (store: any) => {
    const state: State = store.HomeReducer;
    return state.popularProjectUserProfiles;
};

export const selectSearchedProjectUserProfiles = (store: any) => {
    const state: State = store.HomeReducer;
    return state.featuredProjectUserProfiles;
};

export const selectOrderedStars = createSelector([selectStars], (stars) => {
    if (!Array.isArray(stars)) {
        return [];
    }
    const sortedStars = stars.sort((a, b) => a.stars.length - b.stars.length);
    return sortedStars;
});

export const selectOrderedProjectLastModified = createSelector(
    [selectProjectLastModified],
    (projectLastModified) => {
        if (!Array.isArray(projectLastModified)) {
            return [];
        }
        return projectLastModified.sort(
            (a, b) => b.timestamp.seconds - a.timestamp.seconds
        );
    }
);
