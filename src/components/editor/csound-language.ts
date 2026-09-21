import { csound } from "@kunstmusik/codemirror-lang-csound";
import { indentUnit } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { csoundRateHighlighting } from "./csound-highlighting";
import { csoundSynopsis } from "./csound-synopsis";

/** Compose language support with the IDE's presentation choices. */
export function csoundEditorLanguage(fileType?: string): Extension {
    const mode =
        fileType === "csd" || !fileType
            ? "csd"
            : fileType === "sco"
              ? "sco"
              : "orc";
    return [
        csound({ mode, semanticHighlighting: false, hover: false }),
        csoundRateHighlighting(),
        csoundSynopsis(),
        indentUnit.of("  ")
    ];
}
