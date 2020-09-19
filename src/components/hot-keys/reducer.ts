import defaultBindings from "./default-bindings";
import { assoc, mergeAll } from "ramda";
import {
    HotKeysActionTypes,
    IHotKeysCallbacks,
    BindingsMap,
    STORE_EDITOR_KEYBOARD_CALLBACKS,
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
        new_project: undefined,
        // IProjectEditorCommands
        add_file: undefined,
        new_document: undefined,
        open_target_config_dialog: undefined,
        pause_playback: undefined,
        run_project: undefined,
        save_all_documents: undefined,
        save_and_close: undefined,
        save_document: undefined,
        stop_playback: undefined,
        // IEditorCommands
        doc_at_point: undefined
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
        case STORE_EDITOR_KEYBOARD_CALLBACKS: {
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
