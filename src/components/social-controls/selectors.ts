import { RootState } from "@root/store";
import { createSelector } from "@reduxjs/toolkit";
import { IProject, IProjectsReducer, Star } from "../projects/types";
import { keys, propOr } from "ramda";
import { selectActiveProject } from "../projects/selectors";

export const selectActiveProjectUid = (
    store: RootState
): string | undefined => {
    const state: IProjectsReducer = store.ProjectsReducer;
    return state.activeProjectUid;
};

export const selectProjects = (
    store: RootState
): { [projectUid: string]: IProject } | undefined => {
    const state: IProjectsReducer = store.ProjectsReducer;
    return state.projects;
};

export const selectProjectStars = (projectUid: string) =>
    createSelector(
        [
            (state: RootState) =>
                state.ProjectsReducer.projects[projectUid]?.stars
        ],
        (projectStars: Star | undefined) => projectStars || {}
    );

export const selectUserStarredProject = (
    loggedInUserUid: string | undefined,
    projectUid: string | undefined
) =>
    createSelector(
        [selectProjectStars(projectUid || "")],
        (projectStars: Star) => {
            if (!projectUid || !loggedInUserUid) return false;
            return Object.keys(projectStars).includes(loggedInUserUid);
        }
    );

export const selectProjectPublic = (store: RootState): boolean => {
    const activeProject = selectActiveProject(store);
    return propOr(true, "isPublic", activeProject);
};
