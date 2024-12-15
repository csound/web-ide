import { store } from "@root/store";
import {
    ADD_NON_CLOUD_FILE,
    CLEANUP_NON_CLOUD_FILES,
    DELETE_NON_CLOUD_FILE,
    NonCloudFile,
    NonCloudFileTreeEntry,
    CleanupNonCloudFileAction
} from "./types";
import { TAB_CLOSE } from "@comp/project-editor/types";

export const nonCloudFiles: Map<string, NonCloudFile> = new Map();

export const addNonCloudFile = (
    file: NonCloudFileTreeEntry
): { type: typeof ADD_NON_CLOUD_FILE; file: NonCloudFileTreeEntry } => {
    return {
        type: ADD_NON_CLOUD_FILE,
        file: {
            name: file.name,
            createdAt: Number(file.createdAt)
        }
    };
};
export const deleteNonCloudFiles = (filename: string) => {
    return {
        type: DELETE_NON_CLOUD_FILE,
        filename
    };
};

export const cleanupNonCloudFiles = ({
    projectUid
}: {
    projectUid: string;
}): CleanupNonCloudFileAction => {
    for (const openNcf of nonCloudFiles.keys()) {
        store.dispatch({
            type: TAB_CLOSE,
            projectUid,
            documentUid: openNcf
        });
    }

    nonCloudFiles.clear();

    return {
        type: CLEANUP_NON_CLOUD_FILES
    };
};
