import "firebase/auth";
// import { ThunkAction } from "redux-thunk";
import {
    // HotKeysActionTypes,
    IProjectEditorCallbacks,
    STORE_PROJECT_EDITOR_KEYBOARD_CALLBACKS
} from "./types";
// import { Action } from "redux";
import { curry } from "ramda";
import {
    newDocument,
    saveFile
    // exportProject,
    // addDocument
} from "@comp/Projects/actions";
import { getPlayActionFromTarget } from "@comp/TargetControls/utils";
import { stopCsound } from "@comp/Csound/actions";

const withPreventDefault = curry((callback, e: KeyboardEvent) => {
    e && e.preventDefault();
    callback();
});

export const storeProjectEditorKeyboardCallbacks = (projectUid: string) => {
    return async (dispatch: any, getStore) => {
        const store = getStore();
        const playAction = getPlayActionFromTarget(store);

        const callbacks: IProjectEditorCallbacks = {
            new_document: withPreventDefault(() =>
                dispatch(newDocument(projectUid, ""))
            ),
            pause_playback: withPreventDefault(() =>
                console.log("TODO: IMPLEMENT PAUSE!")
            ),
            run_project: withPreventDefault(() => dispatch(playAction)),
            save_all_documents: withPreventDefault(() =>
                console.log("TODO: IMPLEMENT SAVE_ALL!")
            ),
            save_document: withPreventDefault(() => dispatch(saveFile())),
            stop_playback: withPreventDefault(() => dispatch(stopCsound()))
        };
        dispatch({
            type: STORE_PROJECT_EDITOR_KEYBOARD_CALLBACKS,
            callbacks
        });
    };
};

// const setHotKeysAction = ({ keyMap, keyHandlers }): HotKeysActionTypes => ({
//     type: SET_MENU_BAR_HOTKEYS,
//     keyMap,
//     keyHandlers
// });
//
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
