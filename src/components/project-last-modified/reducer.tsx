import { UPDATE_PROJECT_LAST_MODIFIED_LOCALLY } from "./types";
import { assocPath } from "ramda";

export interface IProjectLastModified {
    timestamp: number | undefined;
}

export type IProjectLastModifiedReducer = {
    [projectUid: string]: IProjectLastModified;
};

const ProjectLastModifiedReducer = (
    state: IProjectLastModifiedReducer | undefined,
    action: Record<string, any>
): IProjectLastModifiedReducer => {
    switch (action.type) {
        case UPDATE_PROJECT_LAST_MODIFIED_LOCALLY: {
            return assocPath(
                [action.projectUid, "timestamp"],
                action.timestamp,
                state
            );
        }
        default: {
            return state || {};
        }
    }
};

export default ProjectLastModifiedReducer;
