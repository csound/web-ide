import { RootState } from "@root/store";
import { IProject, IProjectsReducer } from "./types";
import { path, prop } from "ramda";

export const selectActiveProject = (store: RootState): IProject | undefined => {
    const state: IProjectsReducer = store.ProjectsReducer;
    const activeProjectUid: string | undefined = prop(
        "activeProjectUid",
        state
    );
    return activeProjectUid && path(["projects", activeProjectUid], state);
};
