import "firebase/auth";
import { ThunkAction } from "redux-thunk";
import { SET_MENU_BAR_HOTKEYS, HotKeysActionTypes } from "./types";
import { Action } from "redux";
import { assoc, pathOr } from "ramda";

const setHotKeysAction = ({ keyMap, keyHandlers }): HotKeysActionTypes => ({
    type: SET_MENU_BAR_HOTKEYS,
    keyMap,
    keyHandlers
});

// export const setProfileHotKeys = (): ThunkAction<
//     void,
//     any,
//     null,
//     Action<string>
// > => (dispatch, getStore) =>
//     dispatch(setHotKeysAction({ keyMap: {}, keyHandlers: {} }));

// export const setMenuBarHotKeys = (): ThunkAction<
//     void,
//     any,
//     null,
//     Action<string>
// > => (dispatch, getStore) => {
//     const menuBarItems = getMenuBarItems(dispatch, getStore);
//
//     const keyMap = menuBarItems.reduce((acc, { label, keyBinding }) => {
//         acc[label] = keyBinding;
//         return acc;
//     }, {});
//
//     const keyHandlers = menuBarItems.reduce(
//         (acc, { label, callback }) => assoc(label, callback)(acc),
//         {}
//     );
//     dispatch(setHotKeysAction({ keyMap, keyHandlers }));
// };
