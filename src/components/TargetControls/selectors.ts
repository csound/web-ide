import { IStore } from "@store/types";
import { ITargetMap, IDocumentsMap } from "@comp/Projects/types";
import { curry, pathOr } from "ramda";

export const selectProjectTargets = curry(
    (activeProjectUid: string | null, store: IStore) => {
        if (activeProjectUid) {
            return pathOr(
                {} as ITargetMap,
                ["ProjectsReducer", "projects", activeProjectUid, "targets"],
                store
            );
        } else {
            return null;
        }
    }
);

export const selectSelectedTarget = (store: IStore) => {
    return pathOr(null, ["TargetControlsReducer", "selectedTarget"], store);
};

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
