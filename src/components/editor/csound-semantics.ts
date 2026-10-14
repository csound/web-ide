import { analyzeCsoundSemanticLine } from "@kunstmusik/codemirror-lang-csound";
import { bundledSemanticSignatures } from "../../plugins/catalog";

/** Preserve local UDOs and core calls; recognize bundled legacy opcode calls too. */
export function analyzeEditorLine(
    ...args: Parameters<typeof analyzeCsoundSemanticLine>
) {
    const spans = analyzeCsoundSemanticLine(...args);
    if (spans.some((span) => span.kind === "userOpcode")) return spans;
    const pluginSpans = analyzeCsoundSemanticLine(args[0], {
        ...args[1],
        userOpcodeSignatures: bundledSemanticSignatures
    });
    return pluginSpans.some((span) => span.kind === "userOpcode")
        ? pluginSpans
        : spans;
}
