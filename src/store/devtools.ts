import { assoc, assocPath, pipe, path, propEq, when } from "ramda";

export const devToolsActionSanitizer = pipe(
    when(propEq("type", "CSOUND.SET_CSOUND"), assoc("csound", "<<CsoundObj>>")),
    when(
        propEq("type", "HOTKEYS.STORE_EDITOR_KEYBOARD_CALLBACKS"),
        assoc("callbacks", "<<CALLBACKS>>")
    ),
    when(
        propEq("type", "HOTKEYS.STORE_PROJECT_EDITOR_KEYBOARD_CALLBACKS"),
        assoc("callbacks", "<<CALLBACKS>>")
    ),
    when(
        propEq("type", "PROJECT_EDITOR.STORE_EDITOR_INSTANCE"),
        assoc("editorInstance", "<<CodeMirrorObject>>")
    ),
    when(
        propEq("type", "CONSOLE.SET_CLEAR_CONSOLE_CALLBACK"),
        assoc("callback", "<<ClearConsoleCallback>>")
    ),
    when(
        propEq("type", "CONSOLE.SET_PRINT_TO_CONSOLE_CALLBACK"),
        assoc("callback", "<<PrintToConsoleCallback>>")
    )
);

export const devToolsStateSanitizer = pipe(
    when(
        path(["csound", "csound"]),
        assocPath(["csound", "csound"], "<<CsoundObj>>")
    ),
    when(
        path(["HotKeysReducer", "callbacks"]),
        assocPath(["HotKeysReducer", "callbacks"], "<<CALLBACKS>>")
    ),
    when(
        path(["ProjectEditorReducer", "tabDock", "openDocuments"]),
        assocPath(
            ["ProjectEditorReducer", "tabDock", "openDocuments"],
            "<<FIXME>>"
        )
    )
);
