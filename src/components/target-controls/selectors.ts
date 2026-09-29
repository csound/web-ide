import { RootState } from "@root/store";
import { curry } from "ramda";
import { findFallbackPlayTarget } from "./utils";
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

// with fallback to project.csd, default.csd, any .csd, or any .csd/.orc
export const getSelectedTargetDocumentUid =
    (activeProjectUid?: string) =>
    (store: RootState): string | undefined => {
        if (!activeProjectUid) return undefined;

        const controls = store.TargetControlsReducer[activeProjectUid];
        const allDocuments =
            store.ProjectsReducer.projects[activeProjectUid]?.documents;
        const targetName = controls?.selectedTarget ?? controls?.defaultTarget;
        if (targetName) {
            const target = controls.targets[targetName];
            const playlistIndex = controls.selectedTarget
                ? (controls.selectedTargetPlaylistIndex ?? 0)
                : 0;
            const documentUid =
                target?.targetType === "main"
                    ? target.targetDocumentUid
                    : target?.playlistDocumentsUid?.[playlistIndex];
            if (documentUid && allDocuments?.[documentUid]) return documentUid;
        }

        return allDocuments
            ? findFallbackPlayTarget(allDocuments)?.documentUid
            : undefined;
    };

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

// Memoized selector for default target document to prevent unnecessary re-renders
export const selectDefaultTargetDocument = createSelector(
    [
        (state: RootState, projectUid: string) =>
            state?.TargetControlsReducer?.[projectUid]?.defaultTarget,
        (state: RootState, projectUid: string) =>
            state?.TargetControlsReducer?.[projectUid]?.targets,
        (state: RootState, projectUid: string) =>
            state?.ProjectsReducer?.projects?.[projectUid]?.documents
    ],
    (defaultTargetName, targets, allDocuments) => {
        if (!allDocuments) return undefined;

        // If we have a default target, try to use it
        if (defaultTargetName && targets?.[defaultTargetName]) {
            const defaultTarget = targets[defaultTargetName];
            const documentId =
                defaultTarget.targetType === "main"
                    ? defaultTarget.targetDocumentUid
                    : defaultTarget.playlistDocumentsUid?.[0];

            if (documentId && allDocuments[documentId]) {
                return allDocuments[documentId];
            }
        }

        // Fall back to our helper function
        return findFallbackPlayTarget(allDocuments);
    }
);
