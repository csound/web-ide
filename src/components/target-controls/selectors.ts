import { IStore } from "@store/types";
// import { ITarget, ITargetMap } from "./types";
// import { IDocumentsMap } from "@comp/Projects/types";
import { curry, path } from "ramda";

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
