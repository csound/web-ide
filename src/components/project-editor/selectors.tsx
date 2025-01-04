import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "@root/store";
import { path, pathOr } from "ramda";
import { IOpenDocument } from "./types";

export const selectLoggedInUid = createSelector(
    [
        (state: RootState) => {
            if (!state.LoginReducer) return undefined;
            return state.LoginReducer.loggedInUid;
        }
    ],
    (loggedInUid) => loggedInUid
);

export const selectActiveProjectUid = createSelector(
    [
        (state: RootState) => {
            if (!state.ProjectsReducer) return undefined;
            return state.ProjectsReducer.activeProjectUid;
        }
    ],
    (activeProjectUid) => activeProjectUid
);

export const selectProjectOwner = createSelector(
    [
        selectActiveProjectUid,
        (state: RootState) => {
            return state.ProjectsReducer.projects;
        }
    ],
    (projectUid: string | undefined, projects) => {
        if (!projectUid || !projects) return undefined;
        const project = projects[projectUid];
        return project?.userUid ?? undefined;
    }
);

export const selectIsOwner = createSelector(
    [selectProjectOwner, selectLoggedInUid],
    (ownerUid, loggedInUid) => {
        return ownerUid === loggedInUid;
    }
);

export const selectTabDockIndex = (store: RootState): number =>
    pathOr(-1, ["ProjectEditorReducer", "tabDock", "tabIndex"], store);

export const selectCurrentTab = (
    store: RootState
): IOpenDocument | undefined => {
    const tabIndex = selectTabDockIndex(store);
    if (tabIndex > -1) {
        return path(
            ["ProjectEditorReducer", "tabDock", "openDocuments", tabIndex],
            store
        );
    }
};

export const selectCurrentTabDocumentUid = (
    store: RootState
): string | undefined => {
    const tabIndex = selectTabDockIndex(store);
    if (tabIndex > -1) {
        return store?.ProjectEditorReducer?.tabDock?.openDocuments?.[tabIndex]
            ?.uid;
    }
    return undefined;
};
