import { isMac } from "@root/utils";
import { replace, pipe, when } from "ramda";

export const humanizeKeySequence = (keySequence: string): string =>
    pipe(
        when(() => isMac, replace("command", "⌘")),
        when(() => isMac, replace("opt", "⌥"))
    )(keySequence);
