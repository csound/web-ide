import { IProject, IProjectsReducer } from "./types";
import { pathOr, propOr } from "ramda";

export const selectActiveProject = (store: any): IProject => {
    const state: IProjectsReducer = store.projects;
    const activeProjectUid = propOr("", "activeProject", state);
    return activeProjectUid
        ? pathOr({} as IProject, ["projects", activeProjectUid], state)
        : ({} as IProject);
};
