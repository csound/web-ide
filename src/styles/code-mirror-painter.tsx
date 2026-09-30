import { css, SerializedStyles, Theme } from "@emotion/react";

export const editorStyle = (theme: Theme): SerializedStyles => css`
    height: 100%;
    min-width: 0;
    min-height: 0;
    color: ${theme.textColor};
    background-color: ${theme.background};

    .cm-csound-define {
        color: ${theme.keyword}!important;
    }
    .cm-csound-control-flow {
        color: ${theme.controlFlow}!important;
    }

    .cm-csound-opcode {
        color: ${theme.opcode}!important;
    }

    .cm-panels-bottom {
        overflow: hidden;
        white-space: nowrap;
        color: ${theme.textColor};
        font-family: ${theme.font.monospace};
        font-size: 12px;
        user-select: none;
        background-color: ${theme.gutterBackground};
    }

    .cm-csound-synopsis {
        overflow: hidden;
        text-overflow: ellipsis;
        padding: 4px 10px;
        min-height: 1.4em;
    }

    .cm-csound-synopsis .cm-csound-active-argument {
        font-weight: 700;
    }

    .cm-csound-global-var {
        font-weight: 600;
    }

    .cm-csound-a-rate-var {
        color: ${theme.aRateVar}!important;
    }

    .cm-csound-number {
        color: ${theme.number}!important;
    }

    .cm-csound-i-rate-var {
        color: ${theme.iRateVar}!important;
    }

    .cm-csound-comment {
        color: ${theme.comment}!important;
    }

    .cm-csound-bracket {
        color: ${theme.bracket}!important;
    }

    .cm-csound-boolean,
    .cm-csound-xml-tag,
    .cm-csound-goto-token {
        color: ${theme.keyword}!important;
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
    .cm-tooltip {
        border: 1px solid ${theme.line};
        background-color: ${theme.tooltipBackground};
        color: ${theme.textColor};
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
    }

    .cm-tooltip-autocomplete > ul {
        display: grid;
        grid-template-columns: auto fit-content(24ch) minmax(0, 1fr);
        column-gap: 1ch;
    }

    .cm-tooltip-autocomplete > ul > li {
        color: ${theme.textColor};
        display: grid;
        grid-column: 1 / -1;
        grid-template-columns: subgrid;
        align-items: baseline;
    }

    .cm-tooltip-autocomplete > ul > completion-section {
        grid-column: 1 / -1;
    }

    .cm-tooltip-autocomplete .cm-completionIcon {
        grid-column: 1;
    }

    .cm-tooltip-autocomplete .cm-completionLabel {
        grid-column: 2;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .cm-tooltip-autocomplete > ul > li[aria-selected],
    .cm-tooltip-autocomplete > ul > li:hover {
        background-color: ${theme.buttonBackgroundHover};
        color: ${theme.textColor};
    }

    .cm-tooltip-autocomplete .cm-completionDetail {
        color: ${theme.altTextColor};
        opacity: 1;
        grid-column: 3;
        min-width: 0;
        margin-left: 0;
        max-width: 48ch;
        white-space: normal;
        overflow-wrap: anywhere;
        font-style: normal;
    }

    .cm-tooltip-autocomplete .cm-completionMatchedText {
        color: ${theme.keyword};
        font-weight: 600;
    }
`;
