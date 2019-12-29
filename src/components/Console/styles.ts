import { css } from "@emotion/core";
// import { css as classCss } from "emotion";

export const listWrapper = theme => css`
    height: 100%;
    width: 100%;
    white-space: nowrap;
    font-family: ${theme.font.monospace};
    color: ${theme.console.primary};
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

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background-color: ${theme.scrollbar.primary};
        width: 6px;
        border-radius: 6px;
        border: 3px solid transparent;
    }

    &:hover {
        scrollbar-color: red red;
        scrollbar-width: thin;
        &::-webkit-scrollbar {
        }
        &::-webkit-scrollbar-thumb {
            background-color: ${theme.scrollbarHover.primary};
            width: 6px;
            border-radius: 6px;
            border: 3px solid transparent;
        }
        &::-webkit-scrollbar-track {
            background: ${theme.highlightAlt.primary};
        }
    }
`;
