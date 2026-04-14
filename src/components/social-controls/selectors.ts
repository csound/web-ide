import { RootState } from "@root/store";
import { IProject, IProjectsReducer, Star } from "../projects/types";

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

export const selectProjectPublic =
    (projectUid: string | undefined) =>
    (store: RootState): boolean => {
        if (!projectUid) {
            return false;
        }

        return !!store.ProjectsReducer?.projects?.[projectUid]?.isPublic;
    };
