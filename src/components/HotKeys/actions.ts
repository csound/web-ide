// import firebase from "firebase/app";
import "firebase/auth";
import { ThunkAction } from "redux-thunk";
import { SET_MENU_BAR_HOTKEYS, HotKeysActionTypes } from "./types";
import { Action } from "redux";
import { isMac } from "../../utils";
import { newDocument, saveFile } from "../Projects/actions";
import { runCsound, playPauseCsound } from "../Csound/actions";

const getMenuBarItems = (dispatch, getStore) => [
    {
        label: "New File…",
        keyBinding: isMac ? "command+alt+n" : "ctrl+alt+n",
        callback: e => {
            e.preventDefault();
            const store = getStore();
            const activeProjectUid = store.projects.activeProject
                ? store.projects.activeProject.projectUid
                : "";
            dispatch(newDocument(activeProjectUid, ""));
        }
    },

    {
        label: "Save Document",
        keyBinding: isMac ? "command+s" : "ctrl+s",
        callback: e => {
            e.preventDefault();
            dispatch(saveFile());
        }
    },
    {
        label: "Save All",
        keyBinding: isMac ? "opt+command+s" : "ctrl+shift+s",
        callback: e => {
            e.preventDefault();
            dispatch(saveFile());
        }
    },
    {
        label: "Run",
        keyBinding: isMac ? "command+r" : "ctrl+r",
        callback: e => {
            e.preventDefault();
            dispatch(runCsound());
        }
    },

    {
        label: "Pause",
        keyBinding: isMac ? "command+p" : "ctrl+p",
        callback: e => {
            e.preventDefault();

            dispatch(playPauseCsound());
        }
    }
];

const setHotKeysAction = (payload: any): HotKeysActionTypes => {
    return {
        type: SET_MENU_BAR_HOTKEYS,
        payload
    };
};

export const setProfileHotKeys = (): ThunkAction<
    void,
    any,
    null,
    Action<string>
> => (dispatch, getStore) => {
    dispatch(setHotKeysAction({ keyMap: {}, keyHandlers: {} }));
};

export const setMenuBarHotKeys = (): ThunkAction<
    void,
    any,
    null,
    Action<string>
> => (dispatch, getStore) => {
    const menuBarItems = getMenuBarItems(dispatch, getStore);

    const keyMap = menuBarItems.reduce((acc, { label, keyBinding }) => {
        acc[label] = keyBinding;
        return acc;
    }, {});

    const keyHandlers = menuBarItems.reduce((acc, { label, callback }) => {
        acc[label] = callback;
        return acc;
    }, {});

    dispatch(setHotKeysAction({ keyMap, keyHandlers }));
};
