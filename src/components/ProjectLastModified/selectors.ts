import { IStore } from "@store/types";
import { pathOr } from "ramda";

export const selectProjectLastModified = (projectUid: string) => (
    store: IStore
) => {
    return pathOr(null, ["ProjectLastModifiedReducer", projectUid], store);
};
