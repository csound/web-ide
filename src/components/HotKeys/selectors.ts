import { BindingsMap, IHotKeysCallbacks } from "./types";
import { pathOr } from "ramda";

export const selectKeyCallbacks: (
    Selector
) => IHotKeysCallbacks | null = pathOr(null, ["HotKeysReducer", "callbacks"]);

export const selectKeyBindings: (
    Selector
) => BindingsMap | undefined = pathOr(undefined, [
    "HotKeysReducer",
    "bindings"
]);

// export const selectKeyMaps: Selector = path(["HotKeysReducer", "keyMap"]);
