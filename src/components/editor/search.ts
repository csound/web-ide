import { search, searchKeymap } from "@codemirror/search";
import { keymap } from "@codemirror/view";

// Bind to each view so Find follows focus, including tool inputs and outputs.
export const editorSearch = [search({ top: true }), keymap.of(searchKeymap)];
