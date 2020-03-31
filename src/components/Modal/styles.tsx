import { css } from "@emotion/core";
import { shadow } from "@styles/_common";

export const content = theme => css`
    position: absolute;
    outline: none;
    max-height: 100vh;
    overflow: auto;
    & > div {
        color: ${theme.textColor};
        position: relative;
        border: 2px solid ${theme.line};
        border-radius: 6px;
        background-color: ${theme.background};
        ${shadow}
        box-sizing: content-box;
        padding: 16px 32px 24px;
    }
`;
