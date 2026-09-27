import {
    csoundNodeNames as nodes,
    csoundNodeGroups,
    csoundNodeSet
} from "@kunstmusik/codemirror-lang-csound/syntax";
import { syntaxTree } from "@codemirror/language";
import type { Extension, Range } from "@codemirror/state";
import {
    Decoration,
    EditorView,
    ViewPlugin,
    type DecorationSet,
    type ViewUpdate
} from "@codemirror/view";
import { analyzeCsoundSemanticLine } from "@kunstmusik/codemirror-lang-csound";

const identifierNodes = csoundNodeSet(csoundNodeGroups.CsoundIdentifier);
const headerNames = new Set([
    "sr",
    "kr",
    "ksmps",
    "nchnls",
    "nchnls_i",
    "nchnls_hw",
    "0dbfs"
]);
const definitionNodes = csoundNodeSet([
    "instr",
    "endin",
    "opcode",
    "endop",
    "struct",
    "declare",
    "void",
    nodes.HashDefine,
    nodes.HashUndef
]);
const controlNodes = csoundNodeSet([
    "if",
    "then",
    "ithen",
    "kthen",
    "elseif",
    "else",
    "endif",
    "fi",
    "while",
    "until",
    "do",
    "od",
    "enduntil",
    "for",
    "in",
    "switch",
    "case",
    "default",
    "endsw",
    "goto",
    "igoto",
    "kgoto",
    "rigoto",
    "reinit",
    "break",
    "continue",
    "return",
    "rireturn",
    "xin",
    "xout",
    nodes.HashIfdef,
    nodes.HashIfndef,
    nodes.HashElse,
    nodes.HashEnd
]);

function identifierClass(
    text: string,
    parent: string | undefined,
    isOpcode: boolean
): string | null {
    if (parent === nodes.MemberAccessSegment) return null;
    if (headerNames.has(text)) return "cm-csound-global-constant";
    if (/^p\d+$/.test(text)) return "cm-csound-p-field-var";
    if (parent === nodes.LabelName) return "cm-csound-goto-token";
    if (
        parent === nodes.FunctionCallee ||
        parent === nodes.ScoreFunctionCallee ||
        parent === nodes.UdoName ||
        isOpcode
    )
        return "cm-csound-opcode";

    const explicitRate = /:([akiSf])(?:\[\])*$/.exec(text)?.[1];
    const rate = explicitRate ?? /^(?:g)?([akiSf])/.exec(text)?.[1] ?? "i";
    const global =
        text.includes("@global:") ||
        (!text.includes(":") && /^g[akiSf]/.test(text));
    return `cm-csound-${rate.toLowerCase()}-rate-var${global ? " cm-csound-global-var" : ""}`;
}

function decorations(view: EditorView, documentText: string): DecorationSet {
    const ranges: Range<Decoration>[] = [];
    const seen = new Set<string>();
    const opcodePositions = new Set<number>();
    for (const { from, to } of view.visibleRanges) {
        syntaxTree(view.state).iterate({
            from,
            to,
            enter(node) {
                // A token can straddle more than one visible range.
                if (node.to <= from || node.from >= to) return;
                if (node.name === nodes.OrcGenericLine) {
                    const text = view.state.sliceDoc(node.from, node.to);
                    for (const span of analyzeCsoundSemanticLine(text, {
                        offset: node.from,
                        documentText
                    })) {
                        if (
                            span.kind === "builtInOpcode" ||
                            span.kind === "userOpcode"
                        )
                            opcodePositions.add(span.from);
                    }
                }
                let className: string | null = null;
                if (identifierNodes.has(node.name)) {
                    className = identifierClass(
                        view.state.sliceDoc(node.from, node.to),
                        node.node.parent?.name,
                        opcodePositions.has(node.from)
                    );
                } else if (definitionNodes.has(node.name))
                    className = "cm-csound-define";
                else if (controlNodes.has(node.name))
                    className = "cm-csound-control-flow";
                else if (node.name === nodes.MacroUsageToken)
                    className = "cm-csound-macro-token";
                else if (node.name === nodes.ScoreOpcode)
                    className = "cm-csound-opcode";
                else if (
                    node.name === nodes.String ||
                    node.name === nodes.RawString
                )
                    className = "cm-csound-s-rate-var";
                else if (node.name === nodes.Number)
                    className = "cm-csound-number";
                else if (node.name === nodes.BooleanLiteral)
                    className = "cm-csound-boolean";
                else if (/^[()[\]{}]$/.test(node.name))
                    className = "cm-csound-bracket";
                else if (
                    /^(LineComment|BlockComment|LineContinuation)$/.test(
                        node.name
                    )
                )
                    className = "cm-csound-comment";
                else if (
                    /^Csd/.test(node.name) &&
                    /(?:Tag|Open|Close|Csbeats)$/.test(node.name)
                )
                    className = "cm-csound-xml-tag";
                if (className && node.from < node.to) {
                    const key = node.from + ":" + node.to + ":" + node.name;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    ranges.push(
                        Decoration.mark({ class: className }).range(
                            node.from,
                            node.to
                        )
                    );
                    return false;
                }
            }
        });
    }
    return Decoration.set(ranges, true);
}

/**
 * CSS classes for the Web IDE themes.
 * Rates determine variable colors; globals carry an extra class.
 */
export function csoundRateHighlighting(): Extension {
    return ViewPlugin.fromClass(
        class {
            decorations: DecorationSet;
            documentText: string;
            tree;

            constructor(view: EditorView) {
                this.documentText = view.state.doc.toString();
                this.tree = syntaxTree(view.state);
                this.decorations = decorations(view, this.documentText);
            }

            update(update: ViewUpdate) {
                if (update.docChanged)
                    this.documentText = update.state.doc.toString();
                const tree = syntaxTree(update.state);
                if (
                    update.docChanged ||
                    update.viewportChanged ||
                    tree !== this.tree
                ) {
                    this.tree = tree;
                    this.decorations = decorations(
                        update.view,
                        this.documentText
                    );
                }
            }
        },
        { decorations: (plugin) => plugin.decorations }
    );
}
