import { RootState } from "@root/store";
import { createSelector } from "@reduxjs/toolkit";
import { IProject, IProjectsReducer, Star } from "../projects/types";
import { propOr } from "ramda";
import { selectActiveProject } from "../projects/selectors";

export const selectActiveProjectUid = (store: RootState): string | undefined =>
    store.ProjectsReducer?.activeProjectUid;

export const selectProjects = (
    store: RootState
): { [projectUid: string]: IProject } | undefined => {
    const state: IProjectsReducer = store.ProjectsReducer;
    return state.projects;
};

export const selectProjectStars =
    (projectUid: string) =>
    (state: RootState): Star | undefined =>
        state.ProjectsReducer.projects[projectUid]?.stars;

export const selectUserStarredProject = (
    loggedInUserUid: string | undefined,
    projectUid: string | undefined
) => {
    const projectStars = projectUid
        ? selectProjectStars(projectUid)
        : undefined;
    return (state: RootState): boolean => {
        const stars = projectStars ? projectStars(state) : undefined;

        if (!projectUid || !loggedInUserUid || !stars) {
            return false;
        }

        return Object.prototype.hasOwnProperty.call(stars, loggedInUserUid);
    };
};

export const selectProjectPublic = (store: RootState): boolean => {
    const activeProject = selectActiveProject(store);
    return propOr(true, "isPublic", activeProject);
};
