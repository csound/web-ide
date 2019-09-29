export const SET_MENU_BAR_HOTKEYS = "HOTKEYS.SET_MENU_BAR_HOTKEYS";

interface SetMenuBarHotKeysAction {
    type: typeof SET_MENU_BAR_HOTKEYS;
    payload: any;
}

export type HotKeysActionTypes = SetMenuBarHotKeysAction;
