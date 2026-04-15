import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "@root/store";
import { pathOr } from "ramda";
import { IProjectEditorReducer } from "./reducer";
import {
    IOpenDocument,
    IWorkspaceLayoutNode,
    IWorkspacePanelNode
} from "./types";

const selectProjectEditorReducer = (store: RootState): IProjectEditorReducer =>
    store.ProjectEditorReducer as IProjectEditorReducer;

const findPanelById = (
    node: IWorkspaceLayoutNode,
    panelId: string
): IWorkspacePanelNode | undefined => {
    if (node.kind === "panel") {
        return node.id === panelId ? node : undefined;
    }

    return (
        findPanelById(node.first, panelId) ||
        findPanelById(node.second, panelId)
    );
};

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
    const projectEditorReducer = selectProjectEditorReducer(store);
    return tabIndex > -1
        ? projectEditorReducer.tabDock.openDocuments?.[tabIndex]
        : undefined;
};

export const selectCurrentTabDocumentUid = (
    store: RootState
): string | undefined => {
    const tabIndex = selectTabDockIndex(store);
    const projectEditorReducer = selectProjectEditorReducer(store);
    if (tabIndex > -1) {
        return projectEditorReducer.tabDock.openDocuments?.[tabIndex]?.uid;
    }
    return undefined;
};

export const selectWorkspaceRoot = (store: RootState) =>
    selectProjectEditorReducer(store).root;

export const selectActivePanelId = (store: RootState) =>
    selectProjectEditorReducer(store).activePanelId;

export const selectActivePanel = createSelector(
    [selectWorkspaceRoot, selectActivePanelId],
    (root, activePanelId) => findPanelById(root, activePanelId)
);
