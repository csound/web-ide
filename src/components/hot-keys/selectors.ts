import { RootState } from "@root/store";
import { BindingsMap, IHotKeysCallbacks } from "./types";
import { path, pathOr } from "ramda";

export const selectKeyCallbacks: (Selector) => IHotKeysCallbacks | undefined =
    path(["HotKeysReducer", "callbacks"]);

export const selectKeyBindings: (Selector) => BindingsMap | undefined = path([
    "HotKeysReducer",
    "bindings"
]);

export const selectUpdateCounter = (Selector: RootState): number =>
    pathOr(0, ["HotKeysReducer", "updateCounter"], Selector);
