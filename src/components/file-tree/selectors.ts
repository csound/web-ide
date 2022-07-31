import { pathOr } from "ramda";
import { IStore } from "@store/types";
import { NonCloudFile } from "./types";

export const selectNonCloudFiles = (store: IStore): NonCloudFile[] => {
    return pathOr([] as any, ["FileTreeReducer", "nonCloudFiles"], store);
};
