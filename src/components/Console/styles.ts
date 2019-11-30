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
