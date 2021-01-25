import { css } from "@emotion/react";

export const hr = (theme) => css`
    padding: 0;
    background-color: ${theme.line};
    height: 2px;
    border: none;
    margin: 0;
`;

export const _shadow = `
    box-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 0.2),
        0px 4px 5px 0px rgba(0, 0, 0, 0.14),
        0px 1px 10px 0px rgba(0, 0, 0, 0.12);
`;

export const shadow = css`
    box-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 0.2),
        0px 4px 5px 0px rgba(0, 0, 0, 0.14),
        0px 1px 10px 0px rgba(0, 0, 0, 0.12);
`;

export const windowHeader = (theme) => css`
    background-color: ${theme.highlightBackgroundAlt};
    top: 0;
    position: absolute;
    width: 100%;
    height: 36px;
    display: flex;
    justify-content: center;
    align-content: center;
    flex-direction: column;
    ${shadow}
    & p {
        margin: 0;
        margin-left: 12px;
        color: ${theme.lineNumber};
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
    }
`;

export const _scrollbars = (theme) => css`
    scrollbar-width: thin;
    scrollbar-color: ${theme.scrollbar} transparent;
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
