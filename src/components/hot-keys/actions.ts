import "firebase/auth";
import { RootState, store } from "@root/store";
import { EditorView } from "@codemirror/view";
import { Transaction } from "@codemirror/state";
import { pathOr } from "ramda";
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
import { csoundInstance, pauseCsound, stopCsound } from "@comp/csound/actions";
import { filenameToCsoundType } from "@comp/csound/utils";
import { openEditors } from "@comp/editor";
import { editorEvalCode } from "@comp/editor/utils";
import * as EditorActions from "@comp/editor/actions";
import { keyboardCallbacks } from "./index";
import { UPDATE_COUNTER } from "./types";

const withPreventDefault =
    (callback: any) =>
    (event: KeyboardEvent): void => {
        event && event.preventDefault();
        callback();
    };

export const storeProjectEditorKeyboardCallbacks = (projectUid: string) => {
    keyboardCallbacks.set(
        "add_file",
        withPreventDefault(() => store.dispatch(addDocument(projectUid)))
    );
    keyboardCallbacks.set(
        "new_document",
        withPreventDefault(() => store.dispatch(newDocument(projectUid, "")))
    );
    keyboardCallbacks.set(
        "open_target_config_dialog",
        withPreventDefault(() => store.dispatch(showTargetsConfigDialog()))
    );
    keyboardCallbacks.set(
        "pause_playback",
        withPreventDefault(() => store.dispatch(pauseCsound()))
    );
    keyboardCallbacks.set(
        "run_project",
        withPreventDefault(() => {
            const playActionDefault = getPlayActionFromTarget(projectUid)(
                store.getState()
            );
            const playActionFallback = getPlayActionFromProject(
                projectUid,
                store.getState()
            );
            const playAction = playActionDefault || playActionFallback;

            if (playAction) {
                const isOwner = projectUid
                    ? selectIsOwner(projectUid)(store.getState())
                    : false;
                if (isOwner) {
                    store.dispatch(saveAllFiles());
                }
                store.dispatch(playAction as any);
            }
        })
    );
    keyboardCallbacks.set(
        "save_all_documents",
        withPreventDefault(() => store.dispatch(saveAllFiles()))
    );
    keyboardCallbacks.set(
        "save_and_close",
        withPreventDefault(() => saveAllAndClose(store.dispatch, "/"))
    );
    keyboardCallbacks.set(
        "save_document",
        withPreventDefault(() => store.dispatch(saveFile()))
    );
    keyboardCallbacks.set(
        "stop_playback",
        withPreventDefault(() => store.dispatch(stopCsound()))
    );

    store.dispatch({ type: UPDATE_COUNTER });
};

const selectCurrentEditor = (store: RootState): EditorView | undefined => {
    const currentTab = selectCurrentTab(store);
    const currentDocId = currentTab && currentTab.uid;
    if (currentDocId && openEditors.has(currentDocId)) {
        return openEditors.get(currentDocId);
    }
};

const selectDocumentName = (store, projectUid): any | undefined => {
    const currentTab = selectCurrentTab(store);
    if (currentTab) {
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

export const storeEditorKeyboardCallbacks = (projectUid: string) => {
    keyboardCallbacks.set(
        "doc_at_point",
        withPreventDefault(() => {
            const editor = selectCurrentEditor(store.getState());
            editor && store.dispatch(EditorActions.manualEntryAtPoint(editor));
        })
    );

    keyboardCallbacks.set(
        "undo",
        withPreventDefault(() => {
            const editor = selectCurrentEditor(store.getState());
            editor &&
                editor.dispatch({
                    annotations: Transaction.userEvent.of("undo")
                });
        })
    );

    keyboardCallbacks.set(
        "redo",
        withPreventDefault(() => {
            const editor = selectCurrentEditor(store.getState());
            editor &&
                editor.dispatch({
                    annotations: Transaction.userEvent.of("redo")
                });
        })
    );

    // keyboardCallbacks.set(
    //     "toggle_comment",
    //     withPreventDefault(() => {
    //         const editor = selectCurrentEditor(store.getState());
    //         if (editor && typeof editor.toggleComment === "function") {
    //             editor.toggleComment();
    //         }
    //     })
    // );

    keyboardCallbacks.set(
        "eval_block",
        withPreventDefault(() => {
            const storeState = store.getState();
            const editor = selectCurrentEditor(storeState);
            const csound = csoundInstance;

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
        })
    );

    keyboardCallbacks.set(
        "eval",
        withPreventDefault(() => {
            const storeState = store.getState();
            const editor = selectCurrentEditor(storeState);
            const csound = csoundInstance;

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
        })
    );
};

export const invokeHotKeyCallback = (hotKey: string) => {
    if (keyboardCallbacks.has(hotKey)) {
        const callback = keyboardCallbacks.get(hotKey) as any;
        callback();
    }
};
