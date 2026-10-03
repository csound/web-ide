import { css, SerializedStyles, Theme } from "@emotion/react";
import { _scrollbars } from "@styles/_common";

export const ConsoleContainer = (theme: Theme): SerializedStyles => css`
    height: 100%;
    width: 100%;
    min-height: 0;
    min-width: 0;
    position: relative;
    display: flex;
    flex-direction: column;
    white-space: break-spaces;
    font-family: ${theme.font.monospace};
    font-size: 13px;
    line-height: 1.6;
    box-sizing: border-box;
    color: ${theme.console};
    background: ${theme.background};
    outline: none;
    overflow: hidden;
`;

export const consoleOutput = (theme: Theme): SerializedStyles => css`
    flex: 1 1 auto;
    min-height: 0;
    padding: 8px 12px;
    overflow-x: hidden;
    overflow-y: auto;
    ${_scrollbars(theme)}
    code {
        display: block;
        flex: 1 1 auto;
        min-height: 100%;
        width: 100%;
        position: relative;
    }
`;

export const promptContainer = (theme: Theme): SerializedStyles => css`
    flex: 0 0 auto;
    margin: 0 8px 8px;
    padding: 6px 8px 4px;
    border: 1px solid ${theme.line};
    border-radius: 6px;
    background: ${theme.headerBackground};
    white-space: normal;
    &:focus-within {
        border-color: ${theme.caretColor};
    }
`;

export const promptRow = css`
    display: flex;
    align-items: flex-start;
    gap: 6px;
    min-width: 0;
`;

export const promptLabel = (theme: Theme): SerializedStyles => css`
    color: ${theme.caretColor};
    max-width: 40%;
    padding-top: 5px;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    svg {
        display: block;
        width: 18px;
        height: 21px;
    }
`;

export const promptInput = (theme: Theme): SerializedStyles => css`
    flex: 1;
    min-width: 0;
    width: 100%;
    padding: 5px 0;
    border: 0;
    outline: none;
    resize: none;
    font: inherit;
    line-height: inherit;
    color: ${theme.textColor};
    caret-color: ${theme.caretColor};
    background: transparent;
    &::placeholder {
        color: ${theme.altTextColor};
        opacity: 1;
    }
    &:disabled {
        opacity: 0.7;
    }
    ${_scrollbars(theme)}
`;

export const promptSend = (theme: Theme): SerializedStyles => css`
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 30px;
    height: 30px;
    border: 1px solid ${theme.line};
    border-radius: 4px;
    background: ${theme.buttonBackground};
    color: ${theme.textColor};
    cursor: pointer;
    &:hover:not(:disabled) {
        background: ${theme.buttonBackgroundHover};
    }
    &:focus-visible {
        outline: 2px solid ${theme.caretColor};
        outline-offset: 2px;
    }
    &:disabled {
        opacity: 0.45;
        cursor: default;
    }
    @media (max-width: 767px) {
        flex-basis: 40px;
        height: 40px;
    }
`;

export const promptHint = (theme: Theme): SerializedStyles => css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 18px;
    color: ${theme.altTextColor};
    font-family: ${theme.font.regular};
    font-size: 10px;
    kbd {
        font: inherit;
    }
    button {
        padding: 0 2px;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        text-decoration: underline;
        cursor: pointer;
        &:focus-visible {
            outline: 2px solid ${theme.caretColor};
        }
    }
`;

export const promptError = (theme: Theme): SerializedStyles => css`
    color: ${theme.errorText};
    font-family: ${theme.font.regular};
    font-size: 12px;
    margin-top: 4px;
`;
