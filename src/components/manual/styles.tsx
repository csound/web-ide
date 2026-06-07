import { css, SerializedStyles, Theme } from "@emotion/react";

export const page = (theme: Theme): SerializedStyles => css`
    min-height: 100%;
    padding: 24px;
    box-sizing: border-box;
    background: ${theme.background};
    color: ${theme.textColor};
`;

export const searchInput = (theme: Theme): SerializedStyles => css`
    display: block;
    width: 100%;
    height: 34px;
    padding: 6px 12px;
    font-size: 14px;
    line-height: 1.42857143;
    color: ${theme.textColor};
    background-color: ${theme.background};
    background-image: none;
    border: 1px solid ${theme.line};
    border-radius: 4px;
    box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);
    transition:
        border-color ease-in-out 0.15s,
        box-shadow ease-in-out 0.15s;

    &::placeholder {
        color: ${theme.altTextColor};
        opacity: 1;
    }
`;

export const title = (theme: Theme): SerializedStyles => css`
    color: ${theme.textColor};
`;

export const sectionTitle = (theme: Theme): SerializedStyles => css`
    color: ${theme.textColor};
`;

export const opcodeContainer = css`
    display: inline-block;
    padding: 0;
    margin: 0 12px;
    height: 100%;
`;

export const entry = (theme: Theme): SerializedStyles => css`
    display: block;
    font-size: 14px;
    text-decoration: none;
    margin: 3px 0;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    color: ${theme.textColor};
    &:hover {
        background-color: ${theme.buttonBackgroundHover};
    }

    span {
        font-weight: 500;
        display: inline-block;
    }

    p {
        padding: 0;
        margin: 0;
        display: initial;
        color: ${theme.altTextColor};
    }
`;
