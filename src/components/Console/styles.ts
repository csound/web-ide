import { css } from "@emotion/core";
// import { css as classCss } from "emotion";

export const virtualizedListContainer = css`
    position: relative;
`;

export const listWrapper = theme => css`
    height: 100%;
    width: 100%;
    white-space: nowrap;
    font-family: ${theme.font.monospace};
    background-color: ${theme.background};
    color: ${theme.console};
    padding: 6px;
    outline: none;
    scrollbar-width: thin;
    scrollbar-color: ${theme.scrollbar} transparent;
    & li {
        height: 16px;
        line-height: 16px;
        font-size: 14px;
        position: relative;
        display: block;
        padding: 0;
    }

    &::-webkit-scrollbar {
        width: 8px;
    }

    &:scrollbar-track,
    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background-color: ${theme.scrollbar};
        width: 6px;
        border-radius: 6px;
        border: 3px solid transparent;
    }

    &:hover {
        scrollbar-color: ${theme.scrollbarHover} ${theme.highlightBackgroundAlt};
        &::-webkit-scrollbar {
        }
        &::-webkit-scrollbar-thumb {
            background-color: ${theme.scrollbarHover};
            width: 6px;
            border-radius: 6px;
            border: 3px solid transparent;
        }
        &::-webkit-scrollbar-track {
            background: ${theme.highlightBackgroundAlt};
        }
    }
`;
