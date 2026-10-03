import { css, Theme } from "@emotion/react";

export const dialog = (theme: Theme) => css`
    width: min(480px, calc(100vw - 32px));
    max-width: 100%;
    h3 {
        margin: 0 0 20px;
        font-size: 20px;
    }
    h4 {
        margin: 24px 0 8px;
        font-size: 15px;
    }
    p {
        font-size: 13px;
        line-height: 1.6;
    }
    label {
        display: block;
        margin-bottom: 8px;
        font-size: 13px;
    }
    input,
    textarea {
        box-sizing: border-box;
        display: block;
        width: 100%;
        padding: 12px;
        color: ${theme.textColor};
        background: ${theme.textFieldBackground};
        border: 1px solid ${theme.altTextColor};
        border-radius: 6px;
        font: 12px/1.6 ${theme.font.monospace};
    }
    textarea {
        resize: vertical;
        min-height: 112px;
    }
    input:focus-visible,
    textarea:focus-visible {
        outline: 2px solid ${theme.tabHighlightActive};
        outline-offset: 2px;
    }
    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
    }
    .MuiButton-root {
        min-height: 44px;
        text-transform: none;
    }
    .social {
        display: flex;
        gap: 12px;
        margin-top: 20px;
    }
    .copy-status {
        min-height: 21px;
        margin-bottom: 0;
    }
`;
