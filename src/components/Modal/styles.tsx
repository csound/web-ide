import { css } from "@emotion/core";

export const content = theme => css`
    position: absolute;
    outline: none;
    & > div {
        color: ${theme.color.primary};
        position: relative;
        border: 2px solid ${theme.highlight.primary};
        border-radius: 6px;
        background-color: ${theme.background.primary};
        box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.8);
        box-sizing: content-box;
        padding: 16px 32px 24px;
    }
`;
