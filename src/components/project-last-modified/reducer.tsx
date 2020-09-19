import { Timestamp } from "@config/firestore";
import { UPDATE_PROJECT_LAST_MODIFIED_LOCALLY } from "./types";
import { assocPath } from "ramda";

export interface IProjectLastModified {
    timestamp: Timestamp | null;
}

export type IProjectLastModifiedReducer = {
    [projectUid: string]: IProjectLastModified;
};

export default (
    state: IProjectLastModifiedReducer | undefined,
    action: any
) => {
    switch (action.type) {
        case UPDATE_PROJECT_LAST_MODIFIED_LOCALLY:
            return assocPath(
                [action.projectUid, "timestamp"],
                action.timestamp,
                state
            );
        default: {
            return state || {};
        }
    }
};
