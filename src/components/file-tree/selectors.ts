import { RootState } from "@root/store";

export const selectNonCloudFiles = (store: RootState): string[] => {
    return store.FileTreeReducer.nonCloudFiles || [];
};
