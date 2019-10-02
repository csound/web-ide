import { IProjectsReducer } from "./types";

export const selectActiveProject = (store: any) => {
    const state: IProjectsReducer = store.projects;
    return state.activeProject;
};
