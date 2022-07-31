import { append, assoc, pipe } from "ramda";
import { ADD_NON_CLOUD_FILE, NonCloudFile, FileTreeActionTypes } from "./types";

export interface IFileTreeReducer {
    nonCloudFiles: NonCloudFile[];
}

const INIT_STATE: IFileTreeReducer = { nonCloudFiles: [] };

const FileTreeReducer = (
    state: IFileTreeReducer | undefined,
    action: FileTreeActionTypes
): IFileTreeReducer => {
    if (!state) {
        return INIT_STATE;
    } else {
        switch (action.type) {
            case ADD_NON_CLOUD_FILE: {
                return pipe(
                    assoc(
                        "nonCloudFiles",
                        append(action.file, state.nonCloudFiles)
                    )
                )(state);
            }
            default: {
                return state || INIT_STATE;
            }
        }
    }
};

export default FileTreeReducer;
