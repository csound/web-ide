import { RootState } from "@root/store";
import { createSelector } from "@reduxjs/toolkit";

export const selectProjectLastModified = (projectUid: string | undefined) =>
    createSelector(
        [
            () => projectUid,
            (state: RootState) => state.ProjectLastModifiedReducer
        ],
        (projectUid, projectLastModifiedReducer) => {
            if (!projectUid) return undefined;
            return projectLastModifiedReducer[projectUid];
        }
    );
