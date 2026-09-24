import { csoundNodeNames as nodes } from "@kunstmusik/codemirror-lang-csound/syntax";
import { syntaxTree } from "@codemirror/language";
import type { EditorState, Extension } from "@codemirror/state";
import type { SyntaxNode } from "@lezer/common";
import { showPanel } from "@codemirror/view";
import {
    getCsoundHoverInfo,
    analyzeCsoundSemanticLine
} from "@kunstmusik/codemirror-lang-csound";

type CsoundHoverInfo = NonNullable<
    Awaited<ReturnType<typeof getCsoundHoverInfo>>
>;

interface CallContext {
    token: string;
    style: "function" | "legacy";
    rate?: string;
    argument?: number;
}

/** Count input separators, not commas inside expressions, strings, or comments. */
function argumentAt(source: string, position: number): number | undefined {
    if (position < 0) return undefined;
    let argument = 0;
    let depth = 0;
    for (let index = 0; index < Math.min(position, source.length); index++) {
        const char = source[index];
        if (source.startsWith("/*", index)) {
            const end = source.indexOf("*/", index + 2);
            if (end < 0 || end + 2 > position) return undefined;
            index = end + 1;
        } else if (char === ";" || source.startsWith("//", index)) {
            const end = source.indexOf("\n", index);
            if (end < 0 || end >= position) return undefined;
            index = end;
        } else if (source.startsWith("{{", index)) {
            const end = source.indexOf("}}", index + 2);
            if (end < 0 || end + 2 > position) return argument;
            index = end + 1;
        } else if (char === '"') {
            for (index++; index < Math.min(position, source.length); index++) {
                if (source[index] === "\\") index++;
                else if (source[index] === '"') break;
            }
        } else if ("([{".includes(char)) {
            depth++;
        } else if (")]}".includes(char)) {
            if (depth === 0) return undefined;
            depth--;
        } else if (char === "," && depth === 0) {
            argument++;
        }
    }
    return argument;
}

function outputRate(
    text: string,
    spans: ReturnType<typeof analyzeCsoundSemanticLine>
): string | undefined {
    const output = spans.find((span) => span.kind === "output");
    if (!output) return undefined;
    const token = text.slice(output.from, output.to);
    const explicit = /:([aikSfbB](?:\[\])*)$/.exec(token)?.[1];
    const legacy = /^(?:g)?([aikSfbB])/.exec(token)?.[1];
    return (
        explicit ??
        (legacy
            ? legacy + "[]".repeat(token.match(/\[\]/g)?.length ?? 0)
            : undefined)
    );
}

function callAtSelection(state: EditorState): CallContext | undefined {
    const position = state.selection.main.head;
    const documentText = state.doc.toString();
    const tree = syntaxTree(state);
    const after = tree.resolveInner(position, 1);
    let node: SyntaxNode | null =
        after.from === position ? after : tree.resolveInner(position, -1);
    while (node) {
        if (
            node.name === nodes.FunctionCallExpr ||
            node.name === nodes.ScoreFunctionCallExpr
        ) {
            const callee =
                node.getChild(nodes.FunctionCallee) ??
                node.getChild(nodes.ScoreFunctionCallee);
            if (callee) {
                // Once past a nested call's closing bracket, show its parent call.
                if (
                    position >= node.to &&
                    state.sliceDoc(node.to - 1, node.to) === ")"
                ) {
                    node = node.parent;
                    continue;
                }
                const token = state.sliceDoc(callee.from, callee.to).trim();
                const tail = state.sliceDoc(callee.to, node.to);
                const open = tail.indexOf("(");
                const line = state.doc.lineAt(callee.from);
                const output = /=\s*$/.test(
                    state.sliceDoc(line.from, callee.from)
                )
                    ? outputRate(
                          line.text,
                          analyzeCsoundSemanticLine(line.text, {
                              documentText
                          })
                      )
                    : undefined;
                return {
                    token,
                    style: "function",
                    rate: token.split(":")[1] ?? output,
                    argument:
                        open < 0
                            ? undefined
                            : argumentAt(
                                  tail.slice(open + 1),
                                  position - callee.to - open - 1
                              )
                };
            }
        }
        if (node.name === nodes.OrcGenericLine) {
            const text = state.sliceDoc(node.from, node.to);
            const spans = analyzeCsoundSemanticLine(text, { documentText });
            const opcodes = spans.filter(
                (span) =>
                    span.kind === "builtInOpcode" || span.kind === "userOpcode"
            );
            const offset = position - node.from;
            // Legacy lines have generic groups, not FunctionCallExpr children.
            // Pick the innermost call containing the cursor before the outer opcode.
            for (const span of opcodes.slice(1).reverse()) {
                const open = /^\s*\(/.exec(text.slice(span.to));
                if (!open || offset < span.from) continue;
                const from = span.to + open[0].length;
                const argument = argumentAt(text.slice(from), offset - from);
                if (argument !== undefined || offset < from) {
                    const token = text.slice(span.from, span.to);
                    return {
                        token,
                        style: "function",
                        rate: token.split(":")[1],
                        argument
                    };
                }
            }
            const span = opcodes[0];
            if (!span) return undefined;
            const token = text.slice(span.from, span.to);
            return {
                token,
                style: "legacy",
                rate: token.split(":")[1] ?? outputRate(text, spans),
                argument: argumentAt(text.slice(span.to), offset - span.to)
            };
        }
        node = node.parent;
    }
    return undefined;
}

interface Synopsis {
    outputs: string;
    inputs: string;
    style: CallContext["style"];
}

function synopsisFor(info: CsoundHoverInfo, call: CallContext): Synopsis {
    const name = info.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const opcode = new RegExp(`(?<![\\p{L}\\p{N}_])${name}(?=\\s|\\(|$)`, "u");
    const candidates: Synopsis[] = [];
    for (const syntax of info.syntax ?? []) {
        const match = opcode.exec(syntax);
        if (!match) continue;
        let inputs = syntax.slice(match.index + match[0].length).trim();
        const style = inputs.startsWith("(") ? "function" : "legacy";
        if (style === "function") {
            if (!inputs.endsWith(")")) continue;
            inputs = inputs.slice(1, -1);
            // Some manual-derived function forms have unmatched nested brackets.
            if (
                (inputs.match(/\(/g)?.length ?? 0) !==
                (inputs.match(/\)/g)?.length ?? 0)
            )
                continue;
        }
        candidates.push({
            outputs: syntax.slice(0, match.index).trim().replace(/\s*=$/, ""),
            inputs,
            style
        });
    }
    const matchingRate = candidates.filter((syntax) => {
        if (!call.rate) return false;
        const output = syntax.outputs.split(",")[0];
        return (
            output.startsWith(call.rate.replaceAll("[]", "")) &&
            (output.match(/\[\]/g)?.length ?? 0) ===
                (call.rate.match(/\[\]/g)?.length ?? 0)
        );
    });
    const choices = matchingRate.length ? matchingRate : candidates;
    const syntax =
        choices.find((syntax) => syntax.style === call.style) ?? choices[0];
    if (syntax) return syntax;

    const signature =
        info.signatures.find((signature) => signature.outTypes === call.rate) ??
        info.signatures[0];
    const types = (value?: string) =>
        !value || value === "(null)"
            ? ""
            : (value.match(/[a-zA-Z](?:\[\])*/g) ?? []).join(", ");
    return {
        outputs: types(signature?.outTypes),
        inputs: types(signature?.inTypes),
        style: call.style
    };
}

function renderSynopsis(info: CsoundHoverInfo, call: CallContext): HTMLElement {
    const syntax = synopsisFor(info, call);
    const dom = document.createElement("span");
    dom.className = "cm-csound-synopsis-signature";
    if (syntax.outputs)
        dom.append(syntax.outputs + (call.style === "function" ? " = " : " "));
    const opcode = document.createElement("span");
    opcode.className = "cm-csound-opcode";
    opcode.textContent = info.name;
    dom.append(opcode);
    const rate = call.token.split(":")[1];
    if (call.style === "function") dom.append((rate ? `:${rate}` : "") + "(");
    else if (syntax.inputs) dom.append(" ");

    const inputs = syntax.inputs.split(",");
    for (const [index, input] of inputs.entries()) {
        if (index) dom.append(",");
        const active =
            call.argument === index ||
            (call.argument !== undefined &&
                call.argument > index &&
                index === inputs.length - 1 &&
                input.includes("..."));
        const name = /[\p{L}_][\p{L}\p{N}_]*(?:\[\])*|\.{3,}/u.exec(input);
        if (active && name) {
            dom.append(input.slice(0, name.index));
            const argument = document.createElement("strong");
            argument.className = "cm-csound-active-argument";
            argument.textContent = name[0];
            dom.append(argument, input.slice(name.index + name[0].length));
        } else dom.append(input);
    }
    if (call.style === "function") dom.append(")");
    return dom;
}

/** Cursor-driven opcode help in CodeMirror's bottom panel. */
export function csoundSynopsis(): Extension {
    return showPanel.of((view) => {
        const dom = document.createElement("div");
        dom.className = "cm-csound-synopsis";
        dom.setAttribute("role", "status");
        dom.setAttribute("aria-live", "polite");
        let request = 0;
        let destroyed = false;

        function refresh() {
            const current = ++request;
            const call = callAtSelection(view.state);
            dom.replaceChildren();
            if (!call) return;
            const [name] = call.token.split(":");
            void getCsoundHoverInfo(name, {
                documentText: view.state.doc.toString()
            })
                .then((info) => {
                    // The rich catalog loads on demand. Ignore a result for an old cursor.
                    if (destroyed || current !== request || !info) return;
                    dom.replaceChildren(renderSynopsis(info, call));
                })
                .catch(() => {
                    if (!destroyed && current === request)
                        dom.replaceChildren();
                });
        }

        refresh();
        return {
            dom,
            top: false,
            update(update) {
                if (
                    update.docChanged ||
                    update.selectionSet ||
                    syntaxTree(update.state) !== syntaxTree(update.startState)
                )
                    refresh();
            },
            destroy() {
                destroyed = true;
                request++;
            }
        };
    });
}
