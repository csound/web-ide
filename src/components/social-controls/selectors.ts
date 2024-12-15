import { RootState } from "@root/store";
import { IProject, IProjectsReducer, Star } from "../projects/types";
import { curry, keys, pathOr, propOr } from "ramda";
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

export const selectUserStarredProject =
    (loggedInUserUid: string | undefined, projectUid: string | undefined) =>
    (store: RootState) => {
        if (!projectUid) return [];
        if (!loggedInUserUid) return [];
        const projectStars: Star =
            store.ProjectsReducer.projects[projectUid].stars;
        return keys(projectStars).includes(loggedInUserUid);
    };

export const selectProjectPublic = (store: RootState): boolean => {
    const activeProject = selectActiveProject(store);
    return propOr(true, "isPublic", activeProject);
};
