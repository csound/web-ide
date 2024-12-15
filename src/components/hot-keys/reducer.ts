import defaultBindings from "./default-bindings";
import { assoc } from "ramda";
import { HotKeysActionTypes, BindingsMap, UPDATE_COUNTER } from "./types";

export interface IHotKeys {
    bindings: BindingsMap;
    updateCounter: number;
}

const INITIAL_STATE: IHotKeys = {
    updateCounter: 0,
    bindings: defaultBindings
};

const HotKeysReducer = (
    state: IHotKeys | undefined,
    action: HotKeysActionTypes
): IHotKeys => {
    if (!state) {
        return INITIAL_STATE;
    }

    switch (action.type) {
        case UPDATE_COUNTER: {
            return assoc("updateCounter", state.updateCounter + 1, state);
        }
        default: {
            return state;
        }
    }
};

export default HotKeysReducer;
