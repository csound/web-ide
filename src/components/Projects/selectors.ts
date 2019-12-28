import { IStore } from "@store/types";
import { IProject, IProjectsReducer } from "./types";
import { pathOr, propOr } from "ramda";

export const selectActiveProject = (store: IStore): IProject | null => {
    const state: IProjectsReducer = store.ProjectsReducer;
    const activeProjectUid: string | null = propOr(null, "activeProjectUid", state);
    return activeProjectUid
        ? pathOr(null, ["projects", activeProjectUid], state)
        : null;
};
