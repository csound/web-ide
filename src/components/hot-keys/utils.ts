import { isMac } from "@root/utils";
import { replace, pipe, when } from "ramda";

export const humanizeKeySequence = (keySequence: string) =>
    pipe(
        when((__) => isMac, replace("command", "⌘")),
        when((__) => isMac, replace("opt", "⌥"))
    )(keySequence);
