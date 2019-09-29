import { HotKeysActionTypes, SET_MENU_BAR_HOTKEYS } from "./types";
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
            return {
                ...state,
                keyMap: action.payload.keyMap,
                keyHandlers: action.payload.keyHandlers
            };
        }
        default: {
            return state;
        }
    }
};
