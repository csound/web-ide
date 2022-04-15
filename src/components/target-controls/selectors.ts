import { IStore } from "@store/types";
// import { ITarget, ITargetMap } from "./types";
// import { IDocumentsMap } from "@comp/Projects/types";
import { curry, find, path, propEq } from "ramda";

export const selectProjectTargets = curry(
    (activeProjectUid: string | undefined, store: IStore) => {
        if (activeProjectUid) {
            return path(
                ["TargetControlsReducer", activeProjectUid, "targets"],
                store
            );
        }
    }
);

export const selectSelectedTarget = (curry as any)(
    (
        activeProjectUid: string | undefined,
        store: IStore
    ): string | undefined => {
        return (
            activeProjectUid &&
            path(
                ["TargetControlsReducer", activeProjectUid, "selectedTarget"],
                store
            )
        );
    }
);

// with fallback to project.csd
export const getSelectedTargetDocumentUid = (curry as any)(
    (
        activeProjectUid: string | undefined,
        store: IStore
    ): string | undefined => {
        if (activeProjectUid) {
            const targetName = path(
                ["TargetControlsReducer", activeProjectUid, "selectedTarget"],
                store
            );
            const documentUid =
                targetName &&
                path(
                    [
                        "TargetControlsReducer",
                        activeProjectUid,
                        "targets",
                        targetName,
                        "targetDocumentUid"
                    ],
                    store
                );

            if (documentUid) {
                return documentUid;
            } else {
                const allDocuments = path(
                    [
                        "ProjectsReducer",
                        "projects",
                        activeProjectUid,
                        "documents"
                    ],
                    store
                );

                const maybeProjectCsd = find(
                    propEq("filename", "default.csd"),
                    Object.values(allDocuments)
                );
                if (maybeProjectCsd) {
                    return maybeProjectCsd.documentUid;
                }
            }
        }
    }
);

export const selectProjectDocuments = (curry as any)(
    (activeProjectUid: string | undefined, store: IStore) => {
        return (
            activeProjectUid &&
            path(
                ["ProjectsReducer", "projects", activeProjectUid, "documents"],
                store
            )
        );
    }
);

export const selectDefaultTargetName = curry(
    (activeProjectUid: string | undefined, store: IStore) => {
        return (
            activeProjectUid &&
            path(
                ["TargetControlsReducer", activeProjectUid, "defaultTarget"],
                store
            )
        );
    }
);

export const selectTarget = (curry as any)(
    (
        activeProjectUid: string | undefined,
        targetName: string,
        store: IStore
    ) => {
        return (
            activeProjectUid &&
            path(
                [
                    "TargetControlsReducer",
                    activeProjectUid,
                    "targets",
                    targetName
                ],
                store
            )
        );
    }
);
