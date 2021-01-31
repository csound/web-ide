import { IHomeReducer } from "./reducer";
import { IProject } from "@comp/projects/types";
import { IStore } from "@store/types";
import { IFirestoreProject } from "@db/types";
import { createSelector } from "reselect";
import { Timestamp } from "@config/firestore";
import { slice } from "ramda";

export const selectDisplayedStarredProjects = (
    store: IStore
): IFirestoreProject[] => {
    const state: IHomeReducer = store.HomeReducer;
    const displayedStarredProjects = state.displayedStarredProjects;
    return displayedStarredProjects.length === 0
        ? Array.from({ length: 8 })
        : displayedStarredProjects;
};

export const selectSearchProjectsRequest = (store: IStore): boolean => {
    const state: IHomeReducer = store.HomeReducer;
    const request = state.searchProjectsRequest;
    return request;
};

export const selectSearchedProjects = (store: IStore): IFirestoreProject[] => {
    const state: IHomeReducer = store.HomeReducer;
    const searchedProjects = state.searchedProjects;
    return searchedProjects;
};

export const selectSearchedProjectsTotal = (store: IStore): number => {
    const state: IHomeReducer = store.HomeReducer;
    const searchedProjectsTotal = state.searchedProjectsTotal;
    return searchedProjectsTotal;
};

export const selectDisplayedRandomProjects = (
    store: IStore
): IFirestoreProject[] => {
    const state: IHomeReducer = store.HomeReducer;
    const { displayedRandomProjects = [] } = state;
    return displayedRandomProjects.length === 0
        ? Array.from({ length: 4 })
        : displayedRandomProjects;
};

// export const selectTags = (store: IStore) => {
//     const state: IHomeReducer = store.HomeReducer;
//     return state.tags;
// };

export const selectStars = (store: IStore): Record<string, any> => {
    const state: IHomeReducer = store.HomeReducer;
    return state.stars;
};

export const selectProjectLastModified = (
    store: IStore
): Timestamp | undefined => {
    const state: IHomeReducer = store.HomeReducer;
    return state.projectLastModified;
};

export const selectFeaturedProjectUserProfiles = (
    store: IStore
): IFirestoreProject[] => {
    const state: IHomeReducer = store.HomeReducer;
    return state.featuredProjectUserProfiles;
};

export const selectRandomProjectUserProfiles = (
    store: IStore
): IFirestoreProject[] => {
    const state: IHomeReducer = store.HomeReducer;
    return state.randomProjectUserProfiles;
};

export const selectPopularProjectUserProfiles = (
    store: IStore
): IFirestoreProject[] => {
    const state: IHomeReducer = store.HomeReducer;
    return state.popularProjectUserProfiles;
};

export const selectSearchedProjectUserProfiles = (
    store: IStore
): IFirestoreProject[] => {
    const state: IHomeReducer = store.HomeReducer;
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

export const selectPopularProjectsFetchOffset = (store: IStore): number[] => {
    const state: IHomeReducer = store.HomeReducer;
    return [state.popularProjectsOffset, state.popularProjectsTotalRecords];
};

export const selectPopularProjectsSlice = (from: number, to: number) => (
    store: IStore
): IProject[] => {
    const state: IHomeReducer = store.HomeReducer;
    const popularProjects = state.popularProjects;
    return slice(from, to, popularProjects);
};
