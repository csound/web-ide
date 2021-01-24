import { IStore } from "@store/types";
import { IProjectLastModified } from "./reducer";
import { path } from "ramda";

export const selectProjectLastModified = (
    projectUid: string
): ((store: IStore) => IProjectLastModified | undefined) => (store: IStore) => {
    return path(["ProjectLastModifiedReducer", projectUid], store);
};
