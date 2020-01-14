import "firebase/auth";
import {
    IProjectEditorCallbacks,
    STORE_PROJECT_EDITOR_KEYBOARD_CALLBACKS
} from "./types";
import { curry } from "ramda";
import {
    newDocument,
    saveAllAndClose,
    saveAllFiles,
    saveFile,
    addDocument
} from "@comp/Projects/actions";
import { showTargetsConfigDialog } from "@comp/TargetControls/actions";
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
            add_file: withPreventDefault(() =>
                dispatch(addDocument(projectUid))
            ),
            new_document: withPreventDefault(() =>
                dispatch(newDocument(projectUid, ""))
            ),
            open_target_config_dialog: withPreventDefault(() =>
                dispatch(showTargetsConfigDialog())
            ),
            pause_playback: withPreventDefault(() =>
                console.log("TODO: IMPLEMENT PAUSE!")
            ),
            run_project: withPreventDefault(() => dispatch(playAction)),
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
