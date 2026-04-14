import { css, SerializedStyles, Theme } from "@emotion/react";

export const buttonContainer = (theme: Theme): SerializedStyles => css`
    position: relative;
    color: ${theme.headerTextColor};
    border: 1px solid ${theme.line};
    cursor: pointer;
    border-radius: 8px;
    height: 42px;
    width: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    margin-right: 4px;
    line-height: 1;
    transition: background-color 0.15s;

    &:hover {
        background-color: ${theme.buttonBackgroundHover};
    }
`;
