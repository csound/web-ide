import { RootState } from "@root/store";
import { curry } from "ramda";
import { playbackDocuments, projectTarget } from "./model";
import { createSelector } from "reselect";

export const selectProjectTargets =
    (activeProjectUid: string | undefined) => (store: RootState) => {
        if (activeProjectUid) {
            return (
                store.TargetControlsReducer[activeProjectUid]?.targets ??
                undefined
            );
        }
    };

export const selectSelectedTarget = (curry as any)(
    (
        activeProjectUid: string | undefined,
        store: RootState
    ): string | undefined => {
        return activeProjectUid
            ? (store.TargetControlsReducer[activeProjectUid]?.selectedTarget ??
                  undefined)
            : undefined;
    }
);

export const selectPlaybackDocuments = createSelector(
    [
        (state: RootState, projectUid: string) =>
            state.TargetControlsReducer[projectUid],
        (state: RootState, projectUid: string) =>
            state.ProjectsReducer.projects[projectUid]?.documents
    ],
    playbackDocuments
);

export const selectPlaybackMode = (state: RootState, projectUid: string) =>
    projectTarget(state.TargetControlsReducer[projectUid])?.targetType ===
    "playlist"
        ? "playlist"
        : "main";

export const selectPlaylistIndex = (state: RootState, projectUid: string) => {
    const index =
        state.TargetControlsReducer[projectUid]?.selectedTargetPlaylistIndex ??
        0;
    return Math.max(
        0,
        Math.min(index, selectPlaybackDocuments(state, projectUid).length - 1)
    );
};

export const getSelectedTargetDocumentUid =
    (projectUid?: string) => (state: RootState) =>
        projectUid
            ? selectPlaybackDocuments(state, projectUid)[
                  selectPlaylistIndex(state, projectUid)
              ]?.documentUid
            : undefined;

export const selectProjectDocuments = (curry as any)(
    (activeProjectUid: string | undefined, store: RootState) => {
        return (
            activeProjectUid &&
            store?.ProjectsReducer?.projects?.[activeProjectUid]?.documents
        );
    }
);

export const selectDefaultTargetName =
    (activeProjectUid: string | undefined) => (store: RootState) => {
        return activeProjectUid
            ? (store.TargetControlsReducer[activeProjectUid]?.defaultTarget ??
                  undefined)
            : undefined;
    };

export const selectTarget =
    (activeProjectUid: string | undefined, targetName: string | undefined) =>
    (store: RootState) => {
        return activeProjectUid && targetName
            ? (store.TargetControlsReducer[activeProjectUid]?.targets[
                  targetName
              ] ?? undefined)
            : undefined;
    };

export const selectDefaultTargetDocument = createSelector(
    [selectPlaybackDocuments],
    (documents) => documents[0]
);
