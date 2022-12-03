import "firebase/auth";
import {
    IEditorCallbacks,
    IProjectEditorCallbacks,
    STORE_EDITOR_KEYBOARD_CALLBACKS,
    STORE_PROJECT_EDITOR_KEYBOARD_CALLBACKS
} from "./types";
import { path, pathOr } from "ramda";
import { Transaction } from "@codemirror/state";
import { IStore } from "@store/types";
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
import { filenameToCsoundType } from "@comp/csound/utils";
import { editorEvalCode } from "@comp/editor/utils";
import * as EditorActions from "@comp/editor/actions";

const withPreventDefault =
    (callback: any) =>
    (event: KeyboardEvent): void => {
        event && event.preventDefault();
        callback();
    };

export const storeProjectEditorKeyboardCallbacks = (
    projectUid: string
): ((dispatch: (any) => void, getStore: () => IStore) => Promise<void>) => {
    return async (dispatch, getStore) => {
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
                const playActionDefault = getPlayActionFromTarget(projectUid)(
                    getStore()
                );
                const playActionFallback = getPlayActionFromProject(
                    projectUid,
                    getStore()
                );
                const playAction = playActionDefault || playActionFallback;

                if (playAction) {
                    const isOwner = projectUid
                        ? selectIsOwner(projectUid)(getStore())
                        : false;
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
                dispatch(saveAllAndClose("/"))
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

const selectDocumentName = (store, projectUid): any | undefined => {
    const currentTab = selectCurrentTab(store);
    if (currentTab && currentTab.editorInstance) {
        const documentUid = currentTab.uid;
        if (documentUid) {
            const document =
                store.ProjectsReducer.projects[projectUid].documents[
                    documentUid
                ];
            return document && document.filename;
        }
    }
};

export const storeEditorKeyboardCallbacks = (
    projectUid: string
): ((dispatch: (any) => void, getStore: () => IStore) => Promise<void>) => {
    return async (dispatch, getStore) => {
        const callbacks: IEditorCallbacks = {
            doc_at_point: withPreventDefault(() => {
                const editor = selectCurrentEditor(getStore());
                editor && dispatch(EditorActions.manualEntryAtPoint(editor));
            }),
            // find_simple: withPreventDefault(() => {
            //     const editor = selectCurrentEditor(getStore());

            //     const searchField = document.querySelector(
            //         ".CodeMirror-dialog.CodeMirror-dialog-top"
            //     );
            //     if (!searchField) {
            //         editor && editor.execCommand("findPersistent");
            //         const maybeDialog = document.querySelector(
            //             ".CodeMirror-search-field"
            //         );
            //         setTimeout(() => {
            //             maybeDialog && maybeDialog[0] && maybeDialog[0].focus();
            //         }, 100);
            //     } else {
            //         const dialogTop = document.querySelector(
            //             ".CodeMirror-dialog-top"
            //         );
            //         dialogTop && dialogTop.remove();
            //         editor && editor.focus();
            //     }
            // }),
            undo: withPreventDefault(() => {
                const editor = selectCurrentEditor(getStore());
                editor && editor.dispatch(Transaction.userEvent.of("undo"));
            }),
            redo: withPreventDefault(() => {
                const editor = selectCurrentEditor(getStore());
                editor && editor.dispatch(Transaction.userEvent.of("redo"));
            }),
            eval_block: withPreventDefault(() => {
                const storeState = getStore();
                const editor = selectCurrentEditor(storeState);
                const csound = path(["csound", "csound"], storeState);

                const csoundStatus = pathOr(
                    "stopped",
                    ["csound", "status"],
                    storeState
                );
                const documentName = selectDocumentName(storeState, projectUid);
                const documentType =
                    documentName && filenameToCsoundType(documentName);

                if (editor && csound && documentName && documentType) {
                    editorEvalCode(
                        csound,
                        csoundStatus,
                        documentType,
                        editor,
                        true
                    );
                }
            }),
            eval: withPreventDefault(() => {
                const storeState = getStore();
                const editor = selectCurrentEditor(storeState);
                const csound = path(["csound", "csound"], storeState);

                const csoundStatus = pathOr(
                    "stopped",
                    ["csound", "status"],
                    storeState
                );
                const documentName = selectDocumentName(storeState, projectUid);
                const documentType =
                    documentName && filenameToCsoundType(documentName);

                if (editor && csound && documentName && documentType) {
                    editorEvalCode(
                        csound,
                        csoundStatus,
                        documentType,
                        editor,
                        false
                    );
                }
            }),
            toggle_comment: withPreventDefault(() => {
                const storeState = getStore();
                const editor = selectCurrentEditor(storeState);
                if (editor && typeof editor.toggleComment === "function") {
                    editor.toggleComment();
                }
            })
        };

        dispatch({
            type: STORE_EDITOR_KEYBOARD_CALLBACKS,
            callbacks
        });
    };
};

export const invokeHotKeyCallback = (
    hotKey: string
): ((dispatch: (any) => void, getStore: () => IStore) => Promise<void>) => {
    return async (dispatch, getState) => {
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
