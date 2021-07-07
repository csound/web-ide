import { IStore } from "@store/types";
import { path } from "ramda";

export const selectProjectLastModified =
    (projectUid: string) => (store: IStore) => {
        return path(["ProjectLastModifiedReducer", projectUid], store);
    };
