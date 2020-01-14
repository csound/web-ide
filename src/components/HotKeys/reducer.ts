import defaultBindings from "./defaultBindings";
import { assoc, mergeAll } from "ramda";
import {
    HotKeysActionTypes,
    IHotKeysCallbacks,
    BindingsMap,
    STORE_PROJECT_EDITOR_KEYBOARD_CALLBACKS
} from "./types";

export interface IHotKeys {
    bindings: BindingsMap;
    callbacks: IHotKeysCallbacks;
}

const INITIAL_STATE: IHotKeys = {
    bindings: defaultBindings,
    callbacks: {
        // IProfileCommands
        new_project: null,
        // IProjectEditorCommands
        add_file: null,
        new_document: null,
        open_target_config_dialog: null,
        pause_playback: null,
        run_project: null,
        save_all_documents: null,
        save_and_close: null,
        save_document: null,
        stop_playback: null,
        // IEditorCommands
        doc_at_point: null
    }
};

export default (state: IHotKeys, action: HotKeysActionTypes) => {
    switch (action.type) {
        case STORE_PROJECT_EDITOR_KEYBOARD_CALLBACKS: {
            return assoc(
                "callbacks",
                mergeAll([state.callbacks, action.callbacks]),
                state
            );
        }
        default: {
            return state || INITIAL_STATE;
        }
    }
};
