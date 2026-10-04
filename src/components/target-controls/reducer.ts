import { equals } from "ramda";
import { UnknownAction } from "redux";
import {
    ITarget,
    ITargetMap,
    SET_SELECTED_TARGET,
    SET_PLAYLIST_INDEX,
    UPDATE_ALL_TARGETS_LOCALLY,
    UPDATE_DEFAULT_TARGET_LOCALLY,
    UPDATE_TARGET_LOCALLY
} from "./types";

export interface ITargetControl {
    defaultTarget: string | null;
    selectedTarget: string | null;
    selectedTargetPlaylistIndex?: number;
    targets: ITargetMap;
}

export type ITargetControlsReducer = { [projectUid: string]: ITargetControl };

const TargetControlsReducer = (
    state: ITargetControlsReducer = {},
    action:
        | {
              type: string;
              projectUid: string;
              target?: ITarget;
              targetName?: string;
              targets?: ITargetMap;
              selectedTarget?: string | null;
              index?: number;
              defaultTarget?: string;
          }
        | UnknownAction
): ITargetControlsReducer => {
    switch (action.type) {
        case SET_SELECTED_TARGET: {
            if (
                typeof action.projectUid !== "string" ||
                !state[action.projectUid]
            )
                return state;
            return {
                ...state,
                [action.projectUid]: {
                    ...state[action.projectUid],
                    selectedTarget:
                        typeof action.selectedTarget === "string"
                            ? action.selectedTarget
                            : null,
                    selectedTargetPlaylistIndex: 0
                }
            };
        }
        case SET_PLAYLIST_INDEX: {
            if (
                typeof action.projectUid !== "string" ||
                !state[action.projectUid] ||
                typeof action.index !== "number" ||
                !Number.isInteger(action.index) ||
                action.index < 0
            )
                return state;
            return {
                ...state,
                [action.projectUid]: {
                    ...state[action.projectUid],
                    selectedTargetPlaylistIndex: action.index
                }
            };
        }

        case UPDATE_ALL_TARGETS_LOCALLY: {
            if (typeof action.projectUid === "string") {
                const updatedTargetControl: ITargetControl = {
                    ...state[action.projectUid],
                    targets: action.targets ? action.targets : ({} as any),
                    defaultTarget: (action.defaultTarget as string) || null,
                    selectedTarget: (action.defaultTarget as string) || null,
                    selectedTargetPlaylistIndex:
                        state[action.projectUid]?.defaultTarget ===
                            action.defaultTarget &&
                        equals(
                            state[action.projectUid]?.targets,
                            action.targets
                        )
                            ? (state[action.projectUid]
                                  ?.selectedTargetPlaylistIndex ?? 0)
                            : 0
                };

                return {
                    ...state,
                    [action.projectUid]: updatedTargetControl || null
                };
            }
            return state;
        }

        case UPDATE_TARGET_LOCALLY: {
            if (
                action.targetName &&
                action.target &&
                state[action.projectUid as string]
            ) {
                return {
                    ...state,
                    [action.projectUid as string]: {
                        ...state[action.projectUid as string],
                        targets: {
                            ...state[action.projectUid as string].targets,
                            [action.targetName as string]: action.target
                        } as ITargetMap
                    }
                };
            }
            return state;
        }

        case UPDATE_DEFAULT_TARGET_LOCALLY: {
            if (typeof action.projectUid === "string") {
                return {
                    ...state,
                    [action.projectUid]: {
                        ...state[action.projectUid],
                        defaultTarget: action.defaultTarget || null
                    } as ITargetControl
                };
            }
            return state;
        }

        default: {
            return state;
        }
    }
};

export default TargetControlsReducer;
