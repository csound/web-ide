import { isMac } from "@root/utils";
import { BindingsMap } from "./types";

const defaultBindings: BindingsMap = {
    add_file: isMac ? "command+alt+u" : "ctrl+alt+u",
    new_document: isMac ? "command+alt+n" : "ctrl+alt+n",
    pause_playback: isMac ? "command+p" : "ctrl+p",
    run_project: isMac ? "command+r" : "ctrl+r",
    save_document: isMac ? "command+s" : "ctrl+s",
    save_all_documents: isMac ? "opt+command+s" : "ctrl+shift+s",
    save_and_close: isMac ? "opt+command+q" : "ctrl+shift+q",
    stop_playback: isMac ? "opt+command+p" : "ctrl+shift+p"
};

export default defaultBindings;
