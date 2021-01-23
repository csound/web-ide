import { css } from "@emotion/react";

export const starItemContainer = css`
    & > div {
        min-height: unset;
    }
`;

export const starItemIcon = css`
    & > div {
        box-sizing: content-box;
        height: 34px;
        width: 34px;
        padding: 5px;
        margin: 0 9px;
        cursor: default;
        & svg {
            height: 20px !important;
            width: 20px !important;
            margin-top: 7px;
            margin-left: 7px;
        }
    }
`;
