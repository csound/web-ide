import { RootState } from "@root/store";
import { IProject, IProjectsReducer } from "./types";

export const selectActiveProject = (store: RootState): IProject | undefined => {
    const state: IProjectsReducer = store.ProjectsReducer;
    const activeProjectUid = state?.activeProjectUid;

    return activeProjectUid ? state.projects?.[activeProjectUid] : undefined;
};
