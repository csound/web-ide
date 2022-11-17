import { isMac } from "@root/utils";
import { BindingsMap } from "./types";

const defaultBindings: BindingsMap = {
    // project
    add_file: isMac ? "command+alt+u" : "ctrl+alt+u",
    new_document: isMac ? "command+alt+n" : "ctrl+alt+n",
    open_target_config_dialog: isMac ? "command+alt+t" : "ctrl+alt+t",
    pause_playback: isMac ? "command+p" : "ctrl+p",
    run_project: isMac ? "command+r" : "ctrl+r",
    save_document: isMac ? "command+s" : "ctrl+s",
    save_all_documents: isMac ? "opt+command+s" : "ctrl+shift+s",
    save_and_close: isMac ? "opt+command+q" : "ctrl+shift+q",
    stop_playback: isMac ? "opt+command+p" : "ctrl+shift+p",
    // editor
    doc_at_point: isMac ? "ctrl+." : "alt+.",
    // find_simple: isMac ? "command+f" : "ctrl+f",
    undo: isMac ? "command+z" : "ctrl+z",
    redo: isMac ? "shift+command+z" : "shift+ctrl+z",
    eval: isMac ? "command+e" : "ctrl+e",
    eval_block: isMac ? "command+enter" : "ctrl+enter",
    toggle_comment: isMac
        ? ["command+;", "opt+command+;"]
        : ["ctrl+;", "ctrl+shift+;"]
};

export default defaultBindings;
