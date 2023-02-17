import { RootState } from "@store/types";
import { IProjectLastModified } from "./reducer";
import { path } from "ramda";

export const selectProjectLastModified =
    (
        projectUid: string
    ): ((store: RootState) => IProjectLastModified | undefined) =>
    (store: RootState) => {
        return path(["ProjectLastModifiedReducer", projectUid], store);
    };
