import { ADD_NON_CLOUD_FILE, AddNonCloudFile, NonCloudFile } from "./types";

export const addNonCloudFile = (file: NonCloudFile): AddNonCloudFile => {
    return {
        type: ADD_NON_CLOUD_FILE,
        file
    };
};
