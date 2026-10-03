import { css, type Theme } from "@emotion/react";

export const editor = css`
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
`;
export const toolbar = (theme: Theme) => css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    padding: 12px 16px;
    border-bottom: 1px solid ${theme.line};
    border-left: 3px solid ${theme.attribute};
    background: ${theme.highlightBackgroundAlt};
`;
export const description = (theme: Theme) => css`
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    > svg {
        color: ${theme.attribute};
        width: 20px;
    }
    > div {
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-width: 0;
    }
    strong {
        color: ${theme.textColor};
        font-size: 13px;
        overflow-wrap: anywhere;
    }
    span {
        color: ${theme.altTextColor};
        font-size: 12px;
    }
`;
export const actions = css`
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
`;
export const discardButton = (theme: Theme) => css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 36px;
    border: 1px solid ${theme.line};
    border-radius: 4px;
    background: ${theme.buttonBackground};
    color: ${theme.textColor};
    padding: 6px 10px;
    font: inherit;
    font-size: 12px;
    cursor: pointer;
    svg {
        width: 18px;
        height: 18px;
    }
    &:hover:enabled {
        background: ${theme.buttonBackgroundHover};
    }
    &:focus-visible {
        outline: 2px solid ${theme.attribute};
        outline-offset: 2px;
    }
    &:disabled {
        opacity: 0.5;
        cursor: default;
    }
`;
export const playButton = (theme: Theme) => css`
    ${discardButton(theme)} border-color: ${theme.attribute};
`;
export const error = (theme: Theme) => css`
    margin: 0;
    padding: 8px 16px;
    color: ${theme.textColor};
    background: ${theme.highlightBackground};
    font-size: 13px;
`;
