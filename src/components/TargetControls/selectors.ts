import { IStore } from "@store/types";
import { ITarget, ITargetMap } from "./types";
import { IDocumentsMap } from "@comp/Projects/types";
import { curry, pathOr } from "ramda";

export const selectProjectTargets = curry(
    (activeProjectUid: string | null, store: IStore) => {
        if (activeProjectUid) {
            return pathOr(
                {} as ITargetMap,
                ["TargetControlsReducer", activeProjectUid, "targets"],
                store
            );
        } else {
            return null;
        }
    }
);

export const selectSelectedTarget = (curry as any)(
    (activeProjectUid: string | null, store: IStore): string | null => {
        return activeProjectUid
            ? pathOr(
                  null,
                  ["TargetControlsReducer", activeProjectUid, "selectedTarget"],
                  store
              )
            : null;
    }
);

export const selectProjectDocuments = (curry as any)(
    (activeProjectUid: string | null, store: IStore) => {
        if (activeProjectUid) {
            return pathOr(
                {} as IDocumentsMap,
                ["ProjectsReducer", "projects", activeProjectUid, "documents"],
                store
            );
        } else {
            return null;
        }
    }
);

export const selectDefaultTargetName = curry(
    (activeProjectUid: string | null, store: IStore) => {
        if (activeProjectUid) {
            return pathOr(
                null,
                ["TargetControlsReducer", activeProjectUid, "defaultTarget"],
                store
            );
        } else {
            return null;
        }
    }
);

export const selectTarget = (curry as any)(
    (activeProjectUid: string | null, targetName: string, store: IStore) => {
        if (activeProjectUid) {
            return pathOr(
                null,
                [
                    "TargetControlsReducer",
                    activeProjectUid,
                    "targets",
                    targetName
                ],
                store
            ) as ITarget | null;
        } else {
            return null;
        }
    }
);
