import { css } from "@emotion/react";

export const starItemContainer = css`
    & > div {
        min-height: unset;
        display: flex;
    }
`;

export const starItemIcon = css`
    width: 52px;
    display: flex;
    align-items: center;
    align-self: center;
    margin-right: 24px;
    & > div {
        box-sizing: content-box;
        height: 34px;
        width: 34px;
        padding: 5px;
        margin: 0 9px;
        cursor: default;
        border-radius: 50%;
        & svg {
            height: 20px !important;
            width: 20px !important;
            margin-top: 1px;
            margin-left: 1px;
        }
    }
`;
