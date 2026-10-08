import { useEffect, useRef } from "react";
import { useTheme } from "@emotion/react";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import {
    EditorView,
    drawSelection,
    keymap,
    lineNumbers,
    placeholder
} from "@codemirror/view";
import {
    defaultKeymap,
    history,
    historyKeymap,
    indentWithTab
} from "@codemirror/commands";
import { editorStyle } from "@styles/code-mirror-painter";
import { codeMirrorTheme } from "@styles/code-mirror-theme";

export function CodePane({
    value,
    label,
    language,
    onChange,
    revealLine,
    hint = ""
}: {
    value: string;
    label: string;
    language: Extension;
    onChange?: (text: string) => void;
    revealLine?: { line: number };
    hint?: string;
}) {
    const theme = useTheme();
    const host = useRef<HTMLDivElement>(null);
    const editor = useRef<EditorView>();
    const changed = useRef(onChange);
    changed.current = onChange;
    const config = useRef(new Compartment());
    useEffect(() => {
        const view = new EditorView({
            parent: host.current!,
            state: EditorState.create({
                doc: value,
                extensions: [
                    config.current.of([]),
                    lineNumbers(),
                    drawSelection(),
                    keymap.of([
                        ...defaultKeymap,
                        ...historyKeymap,
                        indentWithTab
                    ]),
                    EditorView.updateListener.of((update) => {
                        if (update.docChanged)
                            changed.current?.(update.state.doc.toString());
                    })
                ]
            })
        });
        editor.current = view;
        return () => {
            view.destroy();
            editor.current = undefined;
        };
    }, []);
    useEffect(() => {
        editor.current?.dispatch({
            effects: config.current.reconfigure([
                language,
                // Generated output can be large and has no editable undo history.
                ...(onChange ? [history()] : []),
                codeMirrorTheme(theme),
                EditorView.contentAttributes.of({
                    "aria-label": label,
                    tabindex: "0"
                }),
                EditorState.readOnly.of(!onChange),
                EditorView.editable.of(Boolean(onChange)),
                placeholder(hint)
            ])
        });
    }, [language, theme, label, onChange, hint]);
    useEffect(() => {
        const view = editor.current;
        if (view && view.state.doc.toString() !== value)
            view.dispatch({
                changes: { from: 0, to: view.state.doc.length, insert: value }
            });
    }, [value]);
    useEffect(() => {
        const view = editor.current;
        if (!view || !revealLine) return;
        const line = view.state.doc.line(
            Math.max(1, Math.min(view.state.doc.lines, revealLine.line))
        );
        view.dispatch({
            selection: { anchor: line.from, head: line.to },
            effects: EditorView.scrollIntoView(line.from, { y: "center" })
        });
    }, [revealLine]);
    return <div ref={host} css={editorStyle(theme)} />;
}
