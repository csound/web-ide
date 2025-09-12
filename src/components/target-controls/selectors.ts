import { RootState } from "@root/store";
import { curry } from "ramda";
import { IDocument } from "../projects/types";
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
            ? store.TargetControlsReducer[activeProjectUid]?.selectedTarget ??
                  undefined
            : undefined;
    }
);

// with fallback to project.csd, default.csd, any .csd, or any .csd/.orc
export const getSelectedTargetDocumentUid =
    (activeProjectUid?: string) =>
    (store: RootState): string | undefined => {
        if (!activeProjectUid) return undefined;

        const targetName =
            store?.TargetControlsReducer?.[activeProjectUid]?.selectedTarget;
        const documentUid = targetName
            ? store?.TargetControlsReducer?.[activeProjectUid]?.targets?.[
                  targetName
              ]?.targetDocumentUid
            : undefined;

        if (documentUid) {
            return documentUid;
        } else {
            const allDocuments: Record<string, IDocument> | undefined =
                store?.ProjectsReducer?.projects?.[activeProjectUid]?.documents;

            const fallbackDocument = allDocuments
                ? findFallbackPlayTarget(allDocuments)
                : undefined;

            return fallbackDocument?.documentUid;
        }
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
            ? store.TargetControlsReducer[activeProjectUid]?.defaultTarget ??
                  undefined
            : undefined;
    };

export const selectTarget =
    (activeProjectUid: string | undefined, targetName: string | undefined) =>
    (store: RootState) => {
        return activeProjectUid && targetName
            ? store.TargetControlsReducer[activeProjectUid]?.targets[
                  targetName
              ] ?? undefined
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
