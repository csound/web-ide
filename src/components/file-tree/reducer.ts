import { append, assoc, pipe, reject } from "ramda";
import {
    ADD_NON_CLOUD_FILE,
    CLEANUP_NON_CLOUD_FILES,
    DELETE_NON_CLOUD_FILE,
    FileTreeActionTypes
} from "./types";

export interface IFileTreeReducer {
    nonCloudFiles: string[];
}

const INIT_STATE: IFileTreeReducer = { nonCloudFiles: [] };

const FileTreeReducer = (
    state: IFileTreeReducer | undefined,
    action: FileTreeActionTypes
): IFileTreeReducer => {
    if (state) {
        switch (action.type) {
            case ADD_NON_CLOUD_FILE: {
                return pipe(
                    assoc(
                        "nonCloudFiles",
                        append(action.file.name, state.nonCloudFiles)
                    )
                )(state);
            }
            case DELETE_NON_CLOUD_FILE: {
                return pipe(
                    assoc(
                        "nonCloudFiles",
                        reject(
                            (filename: string) => action.filename === filename,
                            state.nonCloudFiles
                        )
                    )
                )(state);
            }
            case CLEANUP_NON_CLOUD_FILES: {
                return pipe(assoc("nonCloudFiles", []))(state);
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
