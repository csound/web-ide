import type { Theme } from "@emotion/react";
import { EditorView } from "@codemirror/view";

export const codeMirrorTheme = (theme: Theme) =>
    EditorView.theme(
        {
            "&": {
                height: "100%",
                minHeight: "0",
                backgroundColor: theme.background,
                color: theme.textColor,
                fontSize: "14px"
            },
            "&.cm-focused": { outline: "none" },
            "@media (pointer: coarse), (max-width: 767px)": {
                ".cm-scroller": { fontSize: "16px" }
            },
            ".cm-scroller": {
                overflow: "auto",
                fontFamily: theme.font.monospace,
                lineHeight: "1.6",
                scrollbarWidth: "thin",
                scrollbarColor: `${theme.scrollbar} ${theme.background}`
            },
            ".cm-content": { padding: "8px 0", caretColor: theme.caretColor },
            ".cm-line": { padding: "0 12px" },
            ".cm-gutters": {
                backgroundColor: theme.gutterBackground,
                color: theme.lineNumber,
                borderRight: `1px solid ${theme.line}`
            },
            ".cm-lineNumbers .cm-gutterElement": {
                minWidth: "3ch",
                padding: "0 6px 0 10px"
            },
            ".cm-foldGutter .cm-gutterElement": { padding: "0 4px" },
            ".cm-activeLineGutter": {
                backgroundColor: theme.highlightBackgroundAlt,
                color: theme.textColor
            },
            ".cm-activeLine": { backgroundColor: theme.highlightBackgroundAlt },
            ".cm-cursor, .cm-dropCursor": { borderLeftColor: theme.caretColor },
            ".cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-content ::selection":
                {
                    backgroundColor: theme.selectedTextColor
                },
            "&.cm-focused .cm-matchingBracket": {
                backgroundColor: theme.highlightBackground,
                outline: `1px solid ${theme.lineHover}`
            },
            ".cm-foldPlaceholder": {
                backgroundColor: theme.highlightBackground,
                color: theme.altTextColor,
                border: `1px solid ${theme.line}`
            },
            ".cm-panels": {
                backgroundColor: theme.headerBackground,
                color: theme.textColor
            },
            ".cm-panels-bottom": { borderTop: `1px solid ${theme.line}` },
            ".cm-csound-synopsis:empty, .cm-panels-bottom:has(> .cm-csound-synopsis:only-child:empty)":
                {
                    display: "none"
                },
            ".cm-scroller::-webkit-scrollbar": {
                width: "10px",
                height: "10px"
            },
            ".cm-scroller::-webkit-scrollbar-thumb": {
                backgroundColor: theme.scrollbar,
                border: `2px solid ${theme.background}`,
                borderRadius: "6px"
            },
            ".cm-scroller::-webkit-scrollbar-thumb:hover": {
                backgroundColor: theme.scrollbarHover
            },
            ".cm-scroller::-webkit-scrollbar-corner": {
                backgroundColor: theme.background
            }
        },
        { dark: theme.mode === "dark" }
    );
