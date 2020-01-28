import { State } from "./reducer";
import { createSelector } from "reselect";

export const selectDisplayedStarredProjects = (store: any) => {
    const state: State = store.HomeReducer;
    return state.displayedStarredProjects;
};

export const selectDisplayedRecentProjects = (store: any) => {
    const state: State = store.HomeReducer;
    return state.displayedRecentProjects;
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

export const selectProjectUserProfiles = (store: any) => {
    const state: State = store.HomeReducer;
    return state.projectUserProfiles;
};

export const selectOrderedStars = createSelector([selectStars], stars => {
    if (!Array.isArray(stars)) {
        return [];
    }
    return stars.sort((a, b) => a.stars.length - b.stars.length);
});

export const selectOrderedProjectLastModified = createSelector(
    [selectProjectLastModified],
    projectLastModified => {
        if (!Array.isArray(projectLastModified)) {
            return [];
        }
        return projectLastModified.sort(
            (a, b) => b.timestamp.seconds - a.timestamp.seconds
        );
    }
);
