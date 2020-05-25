import "firebase/auth";
import {
    IEditorCallbacks,
    IProjectEditorCallbacks,
    STORE_EDITOR_KEYBOARD_CALLBACKS,
    STORE_PROJECT_EDITOR_KEYBOARD_CALLBACKS
} from "./types";
import { curry, pathOr } from "ramda";
import {
    newDocument,
    saveAllAndClose,
    saveAllFiles,
    saveFile,
    addDocument
} from "@comp/Projects/actions";
import { selectIsOwner } from "@comp/ProjectEditor/selectors";
import { showTargetsConfigDialog } from "@comp/TargetControls/actions";
import {
    getPlayActionFromProject,
    getPlayActionFromTarget
} from "@comp/TargetControls/utils";
import { pauseCsound, stopCsound } from "@comp/Csound/actions";
import { selectCurrentTab } from "@comp/ProjectEditor/selectors";
import * as EditorActions from "@comp/Editor/actions";

const withPreventDefault = curry((callback, e: KeyboardEvent) => {
    e && e.preventDefault();
    callback();
});

export const storeProjectEditorKeyboardCallbacks = (projectUid: string) => {
    return async (dispatch: any, getStore) => {
        const callbacks: IProjectEditorCallbacks = {
            add_file: withPreventDefault(() =>
                dispatch(addDocument(projectUid))
            ),
            new_document: withPreventDefault(() =>
                dispatch(newDocument(projectUid, ""))
            ),
            open_target_config_dialog: withPreventDefault(() =>
                dispatch(showTargetsConfigDialog())
            ),
            pause_playback: withPreventDefault(() => dispatch(pauseCsound())),
            run_project: withPreventDefault(() => {
                const playActionDefault = (getPlayActionFromTarget as any)(
                    getStore()
                );
                const playActionFallback = getPlayActionFromProject(
                    projectUid,
                    getStore()
                );
                const playAction = playActionDefault || playActionFallback;

                if (playAction) {
                    const isOwner = selectIsOwner(
                        projectUid as any,
                        getStore()
                    );
                    if (isOwner) {
                        dispatch(saveAllFiles());
                    }
                    dispatch(playAction);
                }
            }),
            save_all_documents: withPreventDefault(() =>
                dispatch(saveAllFiles())
            ),
            save_and_close: withPreventDefault(() =>
                dispatch(saveAllAndClose("/profile"))
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

const selectCurrentEditor = (store): any | null => {
    const currentTab = selectCurrentTab(store);
    if (currentTab) {
        return currentTab.editorInstance;
    } else {
        return null;
    }
};

export const storeEditorKeyboardCallbacks = (projectUid: string) => {
    return async (dispatch: any, getStore) => {
        const callbacks: IEditorCallbacks = {
            doc_at_point: withPreventDefault(() => {
                const editor = selectCurrentEditor(getStore());
                editor && dispatch(EditorActions.docAtPoint(editor));
            })
        };
        dispatch({
            type: STORE_EDITOR_KEYBOARD_CALLBACKS,
            callbacks
        });
    };
};

export const invokeHotKeyCallback = (hotKey: string) => {
    return async (dispatch: any, getState) => {
        const state = getState();
        const maybeCallback = pathOr(
            null,
            ["HotKeysReducer", "callbacks", hotKey],
            state
        );
        if (maybeCallback) {
            maybeCallback(null);
        }
    };
};
