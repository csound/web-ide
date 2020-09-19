import {
    ITargetMap,
    SET_SELECTED_TARGET,
    UPDATE_ALL_TARGETS_LOCALLY,
    UPDATE_DEFAULT_TARGET_LOCALLY,
    UPDATE_TARGET_LOCALLY
} from "./types";
import { assocPath, pipe, prop, when } from "ramda";

export interface ITargetControl {
    defaultTarget: string | null;
    selectedTarget: string | null;
    selectedTargetPlaylistIndex?: number;
    targets: ITargetMap;
}

export type ITargetControlsReducer = { [projectUid: string]: ITargetControl };

const INITIAL_STATE: ITargetControlsReducer = {};

export default (state: ITargetControlsReducer | undefined, action: any) => {
    switch (action.type) {
        case SET_SELECTED_TARGET: {
            return assocPath(
                [action.projectUid, "selectedTarget"],
                prop("selectedTarget", action),
                state
            );
        }
        case UPDATE_ALL_TARGETS_LOCALLY: {
            return pipe(
                assocPath([action.projectUid, "targets"], action.targets),
                assocPath(
                    [action.projectUid, "defaultTarget"],
                    action.defaultTarget
                ),
                when(
                    (s: any) =>
                        typeof action.defaultTarget === "string" &&
                        typeof s.selectedTarget !== "string",
                    assocPath(
                        [action.projectUid, "selectedTarget"],
                        action.defaultTarget
                    )
                )
            )(state);
        }
        case UPDATE_TARGET_LOCALLY: {
            return assocPath(
                [action.projectUid, "targets", action.targetName],
                action.target,
                state
            );
        }
        case UPDATE_DEFAULT_TARGET_LOCALLY: {
            return assocPath(
                [action.projectUid, "defaultTarget"],
                action.defaultTarget,
                state
            );
        }
        default: {
            return state || INITIAL_STATE;
        }
    }
};
