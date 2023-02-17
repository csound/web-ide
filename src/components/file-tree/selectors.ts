import { pathOr } from "ramda";
import { RootState } from "@root/store";

export const selectNonCloudFiles = (store: RootState): string[] => {
    return pathOr([] as string[], ["FileTreeReducer", "nonCloudFiles"], store);
};
