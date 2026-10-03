import { EditorState } from "@codemirror/state";
import {
    EditorView,
    drawSelection,
    keymap,
    lineNumbers
} from "@codemirror/view";
import { selectAll } from "@codemirror/commands";
import {
    csoundCsdLanguage,
    csoundOrcLanguage,
    csoundScoLanguage
} from "@kunstmusik/codemirror-lang-csound";
import { csoundRateHighlighting } from "../components/editor/csound-highlighting";

const previewTheme = EditorView.theme({
    "&": {
        backgroundColor: "var(--surface)",
        color: "var(--text)",
        fontSize: "13px"
    },
    "&.cm-focused": {
        outline: "2px solid var(--accent)",
        outlineOffset: "-2px"
    },
    ".cm-scroller": {
        fontFamily:
            'ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", monospace',
        lineHeight: "1.65",
        maxHeight: "34rem",
        overflow: "auto"
    },
    ".cm-content": { padding: "12px 0" },
    ".cm-line": { padding: "0 12px" },
    ".cm-gutters": {
        backgroundColor: "var(--surface)",
        color: "var(--muted)",
        borderRight: "1px solid var(--line)"
    },
    ".cm-lineNumbers .cm-gutterElement": { minWidth: "3ch", padding: "0 8px" },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
        backgroundColor: "color-mix(in srgb, var(--text) 18%, var(--surface))"
    },
    ".cm-cursor": { display: "none" }
});

/** A selectable Csound preview with no editing, completion, or audio side effects. */
export function createCodePreview(
    parent: HTMLElement,
    source: string,
    language: string,
    label: string,
    firstLine = 1
) {
    const mode =
        /<CsoundSynthesizer\b/i.test(source) || language === "csound-csd"
            ? csoundCsdLanguage
            : language === "csound-sco"
              ? csoundScoLanguage
              : csoundOrcLanguage;
    return new EditorView({
        parent,
        state: EditorState.create({
            doc: source,
            extensions: [
                EditorState.readOnly.of(true),
                EditorView.editable.of(false),
                EditorView.contentAttributes.of({
                    tabindex: "0",
                    "aria-label": `${label}, read only`
                }),
                EditorState.tabSize.of(4),
                mode,
                csoundRateHighlighting(),
                lineNumbers({
                    formatNumber: (line) => String(line + firstLine - 1)
                }),
                EditorView.lineWrapping,
                drawSelection(),
                keymap.of([{ key: "Mod-a", run: selectAll }]),
                previewTheme
            ]
        })
    });
}
