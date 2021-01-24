import { css, SerializedStyles, Theme } from "@emotion/react";
import { _scrollbars } from "@styles/_common";
// import { css as classCss } from "emotion";

export const virtualizedListContainer = css`
    height: 100%;
    position: relative;
`;

export const listWrapper = (theme: Theme): SerializedStyles => css`
    height: 100%;
    width: 100%;
    white-space: nowrap;
    font-family: ${theme.font.monospace};
    background-color: ${theme.background};
    color: ${theme.console};
    padding: 6px;
    outline: none;

    & li {
        height: 16px;
        line-height: 16px;
        font-size: 14px;
        position: relative;
        display: block;
        padding: 0;
    }
    ${_scrollbars(theme)}
`;
