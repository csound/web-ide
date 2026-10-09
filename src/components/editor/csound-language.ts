import {
    csound,
    csoundCompletionSource,
    csoundOpcodeCatalog
} from "@kunstmusik/codemirror-lang-csound";
import type { CompletionSource } from "@codemirror/autocomplete";
import { indentUnit } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { csoundRateHighlighting } from "./csound-highlighting";
import { csoundVariables } from "./csound-variables";
import { csoundSynopsis } from "./csound-synopsis";
import { csdWithScoreLanguages, scoreHighlighting } from "./score-languages";
import { csdScoreSections, inExternalScore } from "./csd-score-sections";
import { udoCatalog } from "./validation/udos";

const builtInCompletions = csoundOpcodeCatalog.opcodes.map((opcode) => ({
    label: opcode.name,
    type: "function",
    detail: opcode.shortDescription
}));
const completionWord =
    /[\p{L}_][\p{L}\p{N}_]*(?::[\p{L}_][\p{L}\p{N}_]*(?:\[\])*)?/u;

// The IDE shows short help in the list, not categories or a second popup.
const editorCompletionSource: CompletionSource = (context) => {
    if (inExternalScore(context.state, context.pos)) return null;
    const udos = context.state.field(udoCatalog, false);
    if (udos) {
        const type = context.matchBefore(/:[\p{L}\p{N}_]*$/u);
        if (type && udos.typeCompletions.length) {
            return {
                from: type.from + 1,
                options: udos.typeCompletions,
                validFor: /^[\p{L}\p{N}_]*$/u
            };
        }
        const word = context.matchBefore(completionWord);
        if (!word && !context.explicit) return null;
        return {
            from: word?.from ?? context.pos,
            options: [
                ...csoundVariables(context.state, context.pos),
                ...udos.completions,
                ...builtInCompletions.filter(
                    (entry) => !udos.entries.has(entry.label)
                )
            ],
            validFor: /^[\p{L}\p{N}_:]+(?:\[\])*$/u
        };
    }
    const result = csoundCompletionSource(context);
    if (!result) return null;
    return {
        ...result,
        options: [
            ...csoundVariables(context.state, context.pos),
            ...result.options.map(({ info, ...option }) => ({
                ...option,
                detail: typeof info === "string" ? info : undefined
            }))
        ]
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
        udoCatalog,
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
