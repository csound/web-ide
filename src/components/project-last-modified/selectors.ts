import { RootState } from "@root/store";

export const selectProjectLastModified =
    (projectUid: string | undefined) => (state: RootState) => {
        if (!projectUid) return undefined;
        return state.ProjectLastModifiedReducer?.[projectUid];
    };
