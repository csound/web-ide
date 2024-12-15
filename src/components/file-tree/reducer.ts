import { append, assoc, pipe, reject } from "ramda";
import {
    ADD_NON_CLOUD_FILE,
    CLEANUP_NON_CLOUD_FILES,
    DELETE_NON_CLOUD_FILE,
    AddNonCloudFileAction,
    DeleteNonCloudFileAction,
    FileTreeActionTypes
} from "./types";

export interface IFileTreeReducer {
    nonCloudFiles: string[];
}

const INIT_STATE: IFileTreeReducer = { nonCloudFiles: [] };

const FileTreeReducer = (
    state: IFileTreeReducer | undefined,
    unknownAction: FileTreeActionTypes
): IFileTreeReducer => {
    if (state) {
        switch (unknownAction.type) {
            case ADD_NON_CLOUD_FILE: {
                const action = unknownAction as AddNonCloudFileAction;
                return {
                    ...state,
                    nonCloudFiles: [...state.nonCloudFiles, action.file.name]
                };
            }
            case DELETE_NON_CLOUD_FILE: {
                const action = unknownAction as DeleteNonCloudFileAction;
                return {
                    ...state,
                    nonCloudFiles: state.nonCloudFiles.filter(
                        (filename) => filename !== action.filename
                    )
                };
            }
            case CLEANUP_NON_CLOUD_FILES: {
                return {
                    ...state,
                    nonCloudFiles: []
                };
            }
            default: {
                return state || INIT_STATE;
            }
        }
    } else {
        return INIT_STATE;
    }
};

export default FileTreeReducer;
