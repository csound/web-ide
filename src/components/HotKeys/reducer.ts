import { HotKeysActionTypes, SET_MENU_BAR_HOTKEYS } from "./types";
import { assoc, pipe } from "ramda";

export interface State {
    readonly keyMap: any;
    readonly keyHandlers: any;
}

const INITIAL_STATE: State = {
    keyMap: {},
    keyHandlers: {}
};

export default (state = INITIAL_STATE, action: HotKeysActionTypes) => {
    switch (action.type) {
        case SET_MENU_BAR_HOTKEYS: {
            return pipe(
                assoc("keyMap", action.keyMap),
                assoc("keyHandlers", action.keyHandlers)
            )(state);
        }
        default: {
            return state;
        }
    }
};
