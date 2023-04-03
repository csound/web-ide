import { css, SerializedStyles, Theme } from "@emotion/react";

export const editorStyle = (theme: Theme): SerializedStyles => css`
    height: 100%;
    color: ${theme.textColor};
    background-color: ${theme.background};

    .cm-focused .cm-selectionBackground,
    .cm-selectionLayer .cm-selectionBackground,
    .cm-content ::selection {
        background-color: ${theme.selectedTextColor};
    }
    .cm-content {
        font-size: 16px;
        font-family: ${theme.font.monospace};
    }
    .cm-focused .cm-cursor {
        border-left-color: ${theme.caretColor};
    }
    .cm-gutters {
        background-color: ${theme.gutterBackground};
        color: "#ddd";
        border: "none";
    }
    .cm-gutter {
        order: 1;
    }

    .cm-csound-define {
        color: ${theme.keyword}!important;
    }
    .cm-csound-control-flow,
    .cm-csound-opcode {
        color: ${theme.opcode}!important;
    }

    .cm-panels-bottom {
        overflow: hidden;
        white-space: nowrap;
        color: ${theme.textColor};
        font-family: ${theme.font.monospace};
        font-size: "14px";
        user-select: "none";
        background-color: ${theme.gutterBackground};
    }

    .cm-lineNumbers {
        fontfamily: ${theme.font.monospace};
        fontsize: "16px";
    }
    .cm-csound-global-var {
        font-weight: 600;
    }

    .cm-csound-a-rate-var {
        color: ${theme.aRateVar}!important;
    }

    .cm-csound-p-field-var {
        color: ${theme.pField}!important;
        font-weight: 600;
    }

    .cm-csound-f-rate-var {
        color: ${theme.fRateVar}!important;
    }

    .cm-csound-global-constant {
        color: ${theme.keyword}!important;
    }

    .cm-csound-macro-token {
        color: ${theme.macro}!important;
        font-weight: 600;
    }

    .cm-csound-k-rate-var {
        color: ${theme.kRateVar}!important;
    }

    .cm-csound-s-rate-var {
        color: ${theme.string}!important;
    }
    .cm-activeLineGutter,
    .cm-activeLine,
    .cm-foldPlaceholder {
        background-color: rgba(0, 0, 0, 0.1) !important;
    }
`;
