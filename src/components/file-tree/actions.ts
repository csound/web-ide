import {
    ADD_NON_CLOUD_FILE,
    CLEANUP_NON_CLOUD_FILES,
    AddNonCloudFile,
    NonCloudFile,
    CleanupNonCloudFile
} from "./types";

export const addNonCloudFile = (file: NonCloudFile): AddNonCloudFile => {
    return {
        type: ADD_NON_CLOUD_FILE,
        file
    };
};

export const cleanupNonCloudFiles = (): CleanupNonCloudFile => {
    return {
        type: CLEANUP_NON_CLOUD_FILES
    };
};
