import { State } from "./reducer";
import { IStore } from "@store/types";
import { IFirestoreProject } from "@db/types";
import { createSelector } from "reselect";
import { Timestamp } from "@config/firestore";

export const selectDisplayedStarredProjects = (
    store: IStore
): IFirestoreProject[] => {
    const state: State = store.HomeReducer;
    const displayedStarredProjects = state.displayedStarredProjects;
    return !displayedStarredProjects
        ? Array.from({ length: 8 })
        : displayedStarredProjects;
};

export const selectSearchProjectsRequest = (store: IStore): boolean => {
    const state: State = store.HomeReducer;
    const request = state.searchProjectsRequest;
    return request;
};

export const selectSearchedProjects = (store: IStore): boolean => {
    const state: State = store.HomeReducer;
    const searchedProjects = state.searchedProjects;
    return searchedProjects;
};

export const selectSearchedProjectsTotal = (store: IStore): number => {
    const state: State = store.HomeReducer;
    const searchedProjectsTotal = state.searchedProjectsTotal;
    return searchedProjectsTotal;
};

export const selectDisplayedRandomProjects = (
    store: IStore
): IFirestoreProject[] => {
    const state: State = store.HomeReducer;
    const { displayedRandomProjects } = state;
    return !displayedRandomProjects
        ? Array.from({ length: 4 })
        : displayedRandomProjects;
};

// export const selectTags = (store: IStore) => {
//     const state: State = store.HomeReducer;
//     return state.tags;
// };

export const selectStars = (store: IStore): Record<string, any> => {
    const state: State = store.HomeReducer;
    return state.stars;
};

export const selectProjectLastModified = (store: IStore): Timestamp => {
    const state: State = store.HomeReducer;
    return state.projectLastModified;
};

export const selectFeaturedProjectUserProfiles = (
    store: IStore
): IFirestoreProject[] => {
    const state: State = store.HomeReducer;
    return state.featuredProjectUserProfiles;
};

export const selectRandomProjectUserProfiles = (
    store: IStore
): IFirestoreProject[] => {
    const state: State = store.HomeReducer;
    return state.randomProjectUserProfiles;
};

export const selectPopularProjectUserProfiles = (
    store: IStore
): IFirestoreProject[] => {
    const state: State = store.HomeReducer;
    return state.popularProjectUserProfiles;
};

export const selectSearchedProjectUserProfiles = (
    store: IStore
): IFirestoreProject[] => {
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
