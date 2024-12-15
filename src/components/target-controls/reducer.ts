import { UnknownAction } from "redux";
import {
    ITarget,
    ITargetMap,
    SET_SELECTED_TARGET,
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
              selectedTarget?: ITargetControl;
              defaultTarget?: string;
          }
        | UnknownAction
): ITargetControlsReducer => {
    switch (action.type) {
        case SET_SELECTED_TARGET: {
            if (
                action.selectedTarget &&
                typeof action.projectUid === "string"
            ) {
                return {
                    ...state,
                    [action.projectUid]: action.selectedTarget
                } as ITargetControlsReducer;
            }
            return state;
        }

        case UPDATE_ALL_TARGETS_LOCALLY: {
            if (typeof action.projectUid === "string") {
                const updatedTargetControl: ITargetControl = {
                    ...state[action.projectUid],
                    targets: action.targets ? action.targets : ({} as any),
                    defaultTarget: (action.defaultTarget as string) || null,
                    selectedTarget:
                        (typeof action.defaultTarget === "string" &&
                        typeof state[action.projectUid]?.selectedTarget !==
                            "string"
                            ? action.defaultTarget
                            : state[action.projectUid]?.selectedTarget) || null
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
