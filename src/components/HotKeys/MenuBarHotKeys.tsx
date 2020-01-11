import React, { useCallback } from "react";
import { newDocument, saveFile } from "@comp/Projects/actions";
import { getPlayActionFromTarget } from "@comp/TargetControls/utils";
import { playPauseCsound } from "@comp/Csound/actions";
import { isMac } from "@root/utils";
import { pathOr } from "ramda";

const MenuBarHotKeys = (dispatch, getStore) => {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    const skeleton = [
        {
            label: "New File…",
            keyBinding: isMac ? "command+alt+n" : "ctrl+alt+n",
            callback: useCallback(
                e => {
                    e.preventDefault();
                    const store = getStore();
                    const activeProjectUid: string | null = pathOr(
                        null,
                        ["ProjectsReducer", "activeProject"],
                        store
                    );
                    activeProjectUid &&
                        dispatch(newDocument(activeProjectUid, ""));
                },
                [dispatch, getStore]
            )
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
                dispatch(getPlayActionFromTarget(getStore()));
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

    return <></>;
};

export default MenuBarHotKeys;
