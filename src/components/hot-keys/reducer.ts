import defaultBindings from "./default-bindings";
// import { assoc, mergeAll } from "ramda";
import {
    HotKeysActionTypes,
    BindingsMap
    // STORE_EDITOR_KEYBOARD_CALLBACKS,
    // STORE_PROJECT_EDITOR_KEYBOARD_CALLBACKS
} from "./types";

export interface IHotKeys {
    bindings: BindingsMap;
}

const INITIAL_STATE: IHotKeys = {
    bindings: defaultBindings
};

const HotKeysReducer = (
    state: IHotKeys,
    action: HotKeysActionTypes
): IHotKeys => {
    switch (action.type) {
        // case STORE_PROJECT_EDITOR_KEYBOARD_CALLBACKS: {
        //     return assoc(
        //         "callbacks",
        //         mergeAll([state.callbacks, action.callbacks]),
        //         state
        //     );
        // }
        // case STORE_EDITOR_KEYBOARD_CALLBACKS: {
        //     return assoc(
        //         "callbacks",
        //         mergeAll([state.callbacks, action.callbacks]),
        //         state
        //     );
        // }
        default: {
            return state || INITIAL_STATE;
        }
    }
};

export default HotKeysReducer;
