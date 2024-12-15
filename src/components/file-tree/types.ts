import { UnknownAction } from "redux";

export const ADD_NON_CLOUD_FILE = "FILE_TREE.ADD_NON_CLOUD_FILE";
export const DELETE_NON_CLOUD_FILE = "FILE_TREE.DELETE_NON_CLOUD_FILE";
export const CLEANUP_NON_CLOUD_FILES = "FILE_TREE.CLEANUP_NON_CLOUD_FILES";

// AKA in-memory files (ex. from render)
export interface NonCloudFile {
    createdAt: Date;
    name: string;
    buffer: Uint8Array;
}

export interface NonCloudFileTreeEntry {
    createdAt: number;
    name: string;
}

export interface AddNonCloudFileAction {
    type: typeof ADD_NON_CLOUD_FILE;
    file: NonCloudFileTreeEntry;
}

export interface CleanupNonCloudFileAction {
    type: typeof CLEANUP_NON_CLOUD_FILES;
}

export interface DeleteNonCloudFileAction {
    type: typeof DELETE_NON_CLOUD_FILE;
    filename: string;
}

export type FileTreeActionTypes =
    | UnknownAction
    | AddNonCloudFileAction
    | CleanupNonCloudFileAction
    | DeleteNonCloudFileAction;
