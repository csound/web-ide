import { ISelector } from "@store/types";
import { path } from "ramda";

export const selectKeyHandlers: ISelector = path([
    "HotKeysReducer",
    "keyHandlers"
]);

export const selectKeyMaps: ISelector = path(["HotKeysReducer", "keyMap"]);
