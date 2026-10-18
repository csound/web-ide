import type { Theme } from "@emotion/react";
import { EditorView } from "@codemirror/view";
import { alpha } from "@mui/material/styles";

/** Apply the IDE palette and sizing to CodeMirror's editor surfaces. */
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
            ".cm-activeLine": {
                backgroundColor: alpha(theme.highlightBackgroundAlt, 0.4)
            },
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
            ".cm-panels-top": { borderBottom: `1px solid ${theme.line}` },
            ".cm-panel.cm-search, .cm-panel.cm-dialog, .cm-panel.cm-panel-lint":
                {
                    fontFamily: theme.font.regular,
                    fontSize: "12px",
                    lineHeight: "1.6",
                    whiteSpace: "normal"
                },
            ".cm-panel.cm-search": { padding: "6px 32px 6px 10px" },
            ".cm-search label": {
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                whiteSpace: "nowrap"
            },
            ".cm-search input[type=checkbox]": {
                accentColor: theme.caretColor
            },
            ".cm-panel .cm-textfield, .cm-panel .cm-button": {
                boxSizing: "border-box",
                maxWidth: "100%",
                minHeight: "28px",
                border: `1px solid ${theme.line}`,
                borderRadius: "4px",
                font: "inherit",
                color: theme.textColor,
                backgroundImage: "none"
            },
            ".cm-panel .cm-textfield": {
                backgroundColor: theme.background,
                padding: "3px 6px"
            },
            ".cm-panel .cm-button": {
                backgroundColor: theme.buttonBackground,
                padding: "3px 8px",
                cursor: "pointer"
            },
            ".cm-panel .cm-button:hover": {
                backgroundColor: theme.buttonBackgroundHover
            },
            ".cm-panel input:focus-visible, .cm-panel button:focus-visible": {
                outline: `1px solid ${theme.caretColor}`,
                outlineOffset: "1px"
            },
            ".cm-panel.cm-search button[name=close]": {
                top: "6px",
                right: "4px",
                width: "24px",
                height: "28px",
                color: theme.altTextColor,
                fontSize: "18px",
                cursor: "pointer"
            },
            ".cm-searchMatch": {
                backgroundColor: alpha(theme.caretColor, 0.15),
                outline: `1px solid ${alpha(theme.caretColor, 0.35)}`
            },
            ".cm-searchMatch-selected": {
                backgroundColor: alpha(theme.caretColor, 0.3),
                outline: `1px solid ${theme.caretColor}`
            },
            ".cm-csound-synopsis:empty": { display: "none" },
            // Keep the panel container in layout so CodeMirror can measure its
            // scroll margins. display:none gives it a false top position of 0.
            ".cm-panels-bottom:has(> .cm-csound-synopsis:only-child:empty)": {
                borderTop: "none"
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
