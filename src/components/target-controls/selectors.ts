import { RootState } from "@root/store";
import { curry, path } from "ramda";
import { IDocument } from "../projects/types";

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

// with fallback to project.csd
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

            const maybeProjectCsd: IDocument | undefined = allDocuments
                ? (Object.values(allDocuments) as IDocument[]).find(
                      (doc) => doc.filename === "default.csd"
                  )
                : undefined;

            return maybeProjectCsd?.documentUid;
        }
    };

export const selectProjectDocuments = (curry as any)(
    (activeProjectUid: string | undefined, store: RootState) => {
        return (
            activeProjectUid &&
            path(
                ["ProjectsReducer", "projects", activeProjectUid, "documents"],
                store
            )
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
