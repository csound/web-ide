import { IStore } from "../../db/interfaces";
import { IProject, IProjectsReducer } from "./types";
import { propOr } from "ramda";

export const selectActiveProject = (store: IStore): IProject | null => {
    const state: IProjectsReducer = store.ProjectsReducer;
    return propOr(null, "activeProject", state);
};
