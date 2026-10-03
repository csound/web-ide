import { syntaxTree } from "@codemirror/language";
import {
    Decoration,
    EditorView,
    ViewPlugin,
    ViewUpdate
} from "@codemirror/view";
import type { Range } from "@codemirror/state";

// Use parser tokens so brackets in strings, characters and comments do not
// change the nesting depth.
function bracketDecorations(view: EditorView) {
    const marks: Range<Decoration>[] = [];
    let depth = 0;
    syntaxTree(view.state).iterate({
        enter(node) {
            const opening = ["(", "[", "{"].includes(node.name);
            const closing = [")", "]", "}"].includes(node.name);
            if (!opening && !closing) return;
            if (closing) depth = Math.max(0, depth - 1);
            if (
                view.visibleRanges.some(
                    ({ from, to }) => node.to > from && node.from < to
                )
            ) {
                marks.push(
                    Decoration.mark({ class: `cm-rainbow-${depth % 6}` }).range(
                        node.from,
                        node.to
                    )
                );
            }
            if (opening) depth += 1;
        }
    });
    return Decoration.set(marks);
}

const plugin = ViewPlugin.fromClass(
    class {
        decorations;
        constructor(view: EditorView) {
            this.decorations = bracketDecorations(view);
        }
        update(update: ViewUpdate) {
            if (
                update.docChanged ||
                update.viewportChanged ||
                syntaxTree(update.state) !== syntaxTree(update.startState)
            ) {
                this.decorations = bracketDecorations(update.view);
            }
        }
    },
    { decorations: (value) => value.decorations }
);

export const rainbowParentheses = [
    plugin,
    EditorView.baseTheme(
        Object.fromEntries(
            [
                ["#8a4300", "#ffd580"],
                ["#6930a8", "#bd93f9"],
                ["#006b78", "#8be9fd"],
                ["#a32367", "#ff79c6"],
                ["#256d1b", "#a6e3a1"],
                ["#963f2b", "#ffb86c"]
            ].flatMap(([light, dark], index) => [
                [`&light .cm-rainbow-${index}`, { color: light }],
                [`&dark .cm-rainbow-${index}`, { color: dark }]
            ])
        )
    )
];
