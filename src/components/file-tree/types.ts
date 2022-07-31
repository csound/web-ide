export const ADD_NON_CLOUD_FILE = "FILE_TREE.ADD_NON_CLOUD_FILE";
export const DELETE_NON_CLOUD_FILE = "FILE_TREE.DELETE_NON_CLOUD_FILE";
export const CLEANUP_NON_CLOUD_FILES = "FILE_TREE.CLEANUP_NON_CLOUD_FILES";

// AKA in-memory files (ex. from render)
export interface NonCloudFile {
    createdAt: Date;
    name: string;
    buffer: Uint8Array;
}

export interface AddNonCloudFile {
    type: typeof ADD_NON_CLOUD_FILE;
    file: NonCloudFile;
}

export interface CleanupNonCloudFile {
    type: typeof CLEANUP_NON_CLOUD_FILES;
}

export interface DeleteNonCloudFile {
    type: typeof DELETE_NON_CLOUD_FILE;
}

export type FileTreeActionTypes =
    | AddNonCloudFile
    | CleanupNonCloudFile
    | DeleteNonCloudFile;
