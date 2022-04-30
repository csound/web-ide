import { css } from "@emotion/react";

export const opcodeContainer = css`
    display: inline-block;
    padding: 0;
    margin: 0 12px;
    height: 100%;
`;

export const entry = css`
    display: block;
    font-size: 14px;
    text-decoration: none;
    margin: 3px 0;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    color: white;
    &:hover {
        background-color: rgba(255, 255, 255, 0.5);
    }

    span {
        font-weight: 500;
        display: inline-block;
    }

    p {
        padding: 0;
        margin: 0;
        display: initial;
    }
`;
