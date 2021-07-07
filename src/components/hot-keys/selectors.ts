import { BindingsMap, IHotKeysCallbacks } from "./types";
import { path } from "ramda";

export const selectKeyCallbacks: (Selector) => IHotKeysCallbacks | undefined =
    path(["HotKeysReducer", "callbacks"]);

export const selectKeyBindings: (Selector) => BindingsMap | undefined = path([
    "HotKeysReducer",
    "bindings"
]);

// export const selectKeyMaps: Selector = path(["HotKeysReducer", "keyMap"]);
