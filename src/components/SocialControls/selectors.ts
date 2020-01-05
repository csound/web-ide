import { IStore } from "@store/types";
import { IProject, IProjectsReducer } from "../Projects/types";
import { createSelector } from "reselect";
import { selectLoggedInUserStars } from "../Profile/selectors";
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

export const selectUserStarredProject = createSelector(
    [selectLoggedInUserStars, selectActiveProjectUid],
    (loggedInUserStars, activeProjectUid) => {
        if (activeProjectUid === null) {
            return false;
        }
        return loggedInUserStars.includes(activeProjectUid);
    }
);
