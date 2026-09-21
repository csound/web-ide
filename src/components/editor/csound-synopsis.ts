import { csoundNodeNames as nodes } from "@kunstmusik/codemirror-lang-csound/syntax";
import { syntaxTree } from "@codemirror/language";
import type { EditorState, Extension } from "@codemirror/state";
import type { SyntaxNode } from "@lezer/common";
import { showPanel } from "@codemirror/view";
import {
    getCsoundHoverInfo,
    analyzeCsoundSemanticLine
} from "@kunstmusik/codemirror-lang-csound";

function opcodeAtSelection(state: EditorState): string | undefined {
    let node: SyntaxNode | null = syntaxTree(state).resolveInner(
        state.selection.main.head,
        -1
    );
    while (node) {
        if (
            node.name === nodes.FunctionCallExpr ||
            node.name === nodes.ScoreFunctionCallExpr
        ) {
            const callee =
                node.getChild(nodes.FunctionCallee) ??
                node.getChild(nodes.ScoreFunctionCallee);
            if (callee) return state.sliceDoc(callee.from, callee.to).trim();
        }
        if (node.name === nodes.OrcGenericLine) {
            const text = state.sliceDoc(node.from, node.to);
            const span = analyzeCsoundSemanticLine(text, {
                documentText: state.doc.toString()
            }).find(
                (span) =>
                    span.kind === "builtInOpcode" || span.kind === "userOpcode"
            );
            return span ? text.slice(span.from, span.to) : undefined;
        }
        node = node.parent;
    }
    return undefined;
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
            const token = opcodeAtSelection(view.state);
            dom.replaceChildren();
            if (!token) return;
            const [name, rate] = token.split(":");
            void getCsoundHoverInfo(name, {
                documentText: view.state.doc.toString()
            })
                .then((info) => {
                    // The rich catalog loads on demand. Ignore a result for an old cursor.
                    if (destroyed || current !== request || !info) return;
                    const title = document.createElement("span");
                    title.className = "cm-csound-opcode";
                    title.textContent = info.name;
                    const signature =
                        info.signatures.find(
                            (signature) => rate && signature.outTypes === rate
                        ) ?? info.signatures[0];
                    const syntax =
                        info.syntax?.find(
                            (line) => !rate || line.trim().startsWith(rate)
                        ) ?? info.syntax?.[0];
                    const text =
                        syntax ??
                        (signature
                            ? `${signature.outTypes === "(null)" ? "" : signature.outTypes + " "}${info.name} ${signature.inTypes === "(null)" ? "" : signature.inTypes}`.trim()
                            : info.name);
                    const detail = document.createElement("span");
                    detail.textContent = ` — ${text}${info.shortDescription ? " · " + info.shortDescription : ""}`;
                    dom.replaceChildren(title, detail);
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
