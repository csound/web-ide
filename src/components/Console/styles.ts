import { css } from "@emotion/core";

export const listElem = css`
    font-family: Space Mono, monospace;
    color: #f8f8f2;
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
`;

export const listWrapper = css`
    div {
        scrollbar-width: thin;
        scrollbar-color: #f8f8f2 #696969;
    }
    div:hover {
        scrollbar-width: thin;
        scrollbar-color: #f8f8f2 #696969;
        &::-webkit-scrollbar {
            width: 11px;
        }

        &::-webkit-scrollbar-track {
            background: #696969;
        }
    }
    div::-webkit-scrollbar {
        width: 8px;
    }

    div::-webkit-scrollbar-track {
        background: transparent;
    }

    div::-webkit-scrollbar-thumb {
        background-color: #f8f8f2;
        width: 6px;
        border-radius: 6px;
        border: 3px solid transparent;
    }
`;
