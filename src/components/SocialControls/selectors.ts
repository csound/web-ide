import { IStore } from "@store/types";
import { IProject, IProjectsReducer } from "../Projects/types";
import { curry, keys, pathOr, propOr } from "ramda";
import { selectActiveProject } from "../Projects/selectors";

export const selectActiveProjectUid = (store: IStore): string | null => {
    const state: IProjectsReducer = store.ProjectsReducer;
    return state.activeProjectUid;
};

export const selectProjects = (
    store: IStore
): { [projectUid: string]: IProject } | null => {
    const state: IProjectsReducer = store.ProjectsReducer;
    return state.projects;
};

export const selectUserStarredProject = curry(
    (loggedInUserUid: string, projectUid: string, store: IStore) => {
        const projectStars: string[] = pathOr(
            [],
            ["ProjectsReducer", "projects", projectUid, "stars"],
            store
        );
        return keys(projectStars).includes(loggedInUserUid);
    }
);

export const selectProjectPublic = (store: IStore) => {
    const activeProject = selectActiveProject(store);
    return propOr(true, "isPublic", activeProject);
};
