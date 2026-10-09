import {
    csound,
    csoundCompletionSource
} from "@kunstmusik/codemirror-lang-csound";
import type { CompletionSource } from "@codemirror/autocomplete";
import { indentUnit } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { csoundRateHighlighting } from "./csound-highlighting";
import { csoundSynopsis } from "./csound-synopsis";
import { csdWithScoreLanguages, scoreHighlighting } from "./score-languages";
import { csdScoreSections, inExternalScore } from "./csd-score-sections";

// The IDE shows short help in the list, not categories or a second popup.
const editorCompletionSource: CompletionSource = (context) => {
    if (inExternalScore(context.state, context.pos)) return null;
    const result = csoundCompletionSource(context);
    if (!result) return null;
    return {
        ...result,
        options: result.options.map(({ info, ...option }) => ({
            ...option,
            detail: typeof info === "string" ? info : undefined
        }))
    };
};

/** Compose language support with the IDE's presentation choices. */
export function csoundEditorLanguage(
    fileType?: string,
    onOpenManual?: (opcode: string) => void
): Extension {
    const mode =
        fileType === "csd" || !fileType
            ? "csd"
            : fileType === "sco"
              ? "sco"
              : "orc";
    const language = csound({
        mode,
        completion: false,
        semanticHighlighting: false,
        hover: false
    });
    return [
        mode === "csd" ? [csdScoreSections, csdWithScoreLanguages] : language,
        scoreHighlighting,
        (mode === "csd" ? csdWithScoreLanguages : language.language).data.of({
            autocomplete: editorCompletionSource
        }),
        csoundRateHighlighting(),
        csoundSynopsis(onOpenManual),
        indentUnit.of("  ")
    ];
}
