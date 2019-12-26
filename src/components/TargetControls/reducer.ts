import { SET_SELECTED_TARGET } from "./types";
import { assoc, prop } from "ramda";

export interface ITargetControlsReducer {
    selectedTarget: string | null;
    selectedTargetPlaylistIndex?: number;
}

const INITIAL_STATE: ITargetControlsReducer = {
    selectedTarget: null
};

export default (state: ITargetControlsReducer | undefined, action: any) => {
    switch (action.type) {
        case SET_SELECTED_TARGET: {
            return assoc(
                "selectedTarget",
                prop("selectedTarget", action),
                state
            );
        }
        default: {
            return state || INITIAL_STATE;
        }
    }
};
