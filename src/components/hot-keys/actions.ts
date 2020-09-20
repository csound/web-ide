import "firebase/auth";
import {
    IEditorCallbacks,
    IProjectEditorCallbacks,
    STORE_EDITOR_KEYBOARD_CALLBACKS,
    STORE_PROJECT_EDITOR_KEYBOARD_CALLBACKS
} from "./types";
import { path } from "ramda";
import {
    newDocument,
    saveAllAndClose,
    saveAllFiles,
    saveFile,
    addDocument
} from "@comp/projects/actions";
import {
    selectIsOwner,
    selectCurrentTab
} from "@comp/project-editor/selectors";
import { showTargetsConfigDialog } from "@comp/target-controls/actions";
import {
    getPlayActionFromProject,
    getPlayActionFromTarget
} from "@comp/target-controls/utils";
import { pauseCsound, stopCsound } from "@comp/csound/actions";

import * as EditorActions from "@comp/editor/actions";

const withPreventDefault = (callback: any) => (event: KeyboardEvent) => {
    event && event.preventDefault();
    callback();
};

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

const selectCurrentEditor = (store): any | undefined => {
    const currentTab = selectCurrentTab(store);
    return currentTab && currentTab.editorInstance;
};

export const storeEditorKeyboardCallbacks = (projectUid: string) => {
    return async (dispatch: any, getStore) => {
        const callbacks: IEditorCallbacks = {
            doc_at_point: withPreventDefault(() => {
                const editor = selectCurrentEditor(getStore());
                editor && dispatch(EditorActions.manualEntryAtPoint(editor));
            }),
            find_simple: withPreventDefault(() => {
                const editor = selectCurrentEditor(getStore());
                const maybeDialog = document.querySelector(
                    ".CodeMirror-dialog"
                );
                if (!maybeDialog) {
                    editor && editor.execCommand("find");
                } else {
                    maybeDialog.remove();
                    editor && editor.focus();
                }
            }),
            undo: withPreventDefault(() => {
                const editor = selectCurrentEditor(getStore());
                editor && editor.execCommand("undo");
            }),
            redo: withPreventDefault(() => {
                const editor = selectCurrentEditor(getStore());
                editor && editor.execCommand("redo");
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
        const maybeCallback = path(
            ["HotKeysReducer", "callbacks", hotKey],
            state
        );
        if (typeof maybeCallback === "function") {
            maybeCallback();
        }
    };
};
