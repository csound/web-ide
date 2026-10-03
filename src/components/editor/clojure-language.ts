import { clojure } from "@nextjournal/lang-clojure";
import {
    HighlightStyle,
    ensureSyntaxTree,
    indentUnit,
    syntaxHighlighting,
    syntaxTree
} from "@codemirror/language";
import type { EditorState, Extension } from "@codemirror/state";
import type { SyntaxNode } from "@lezer/common";
import { tags } from "@lezer/highlight";
import { rainbowParentheses } from "./rainbow-parentheses";

export function clojureEditorLanguage(): Extension {
    return [
        clojure(),
        syntaxHighlighting(
            HighlightStyle.define([
                { tag: tags.keyword, class: "cm-lisp-keyword" },
                { tag: [tags.atom, tags.null], class: "cm-lisp-atom" },
                {
                    tag: tags.definition(tags.variableName),
                    class: "cm-lisp-definition"
                },
                { tag: tags.number, class: "cm-lisp-number" },
                {
                    tag: [tags.string, tags.regexp, tags.emphasis],
                    class: "cm-lisp-string"
                },
                { tag: tags.comment, class: "cm-lisp-comment" }
            ])
        ),
        indentUnit.of("  "),
        rainbowParentheses
    ];
}

// A cursor at the closing delimiter belongs to the form just before it.
export function findClojureForm(
    state: EditorState,
    position = state.selection.main.head,
    topLevel = false
): { from: number; to: number } | undefined {
    const tree =
        ensureSyntaxTree(state, state.doc.length, 100) ?? syntaxTree(state);
    const atOpening = ["(", "[", "{"].includes(
        state.sliceDoc(position, position + 1)
    );
    let node: SyntaxNode | null = tree.resolveInner(
        position,
        atOpening ? 1 : -1
    );
    if (node.type.isTop) node = tree.resolveInner(position, 1);
    let form: SyntaxNode | undefined;
    while (node && !node.type.isTop) {
        if (node.name === "LineComment" || node.name === "Discard") return;
        if (
            node.parent?.type.isTop ||
            ["List", "Vector", "Map"].includes(node.name)
        ) {
            if (!form || topLevel) form = node;
        }
        node = node.parent;
    }
    while (
        form?.parent &&
        [
            "Quote",
            "Deref",
            "SyntaxQuote",
            "Unquote",
            "UnquoteSplicing",
            "Meta",
            "Set",
            "AnonymousFunction"
        ].includes(form.parent.name)
    ) {
        form = form.parent;
    }
    return form && { from: form.from, to: form.to };
}
