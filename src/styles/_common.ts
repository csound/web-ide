import { css } from "@emotion/core";

export const hr = theme => css`
    padding: 0;
    background-color: ${theme.highlight.primary};
    height: 2px;
    border: none;
    margin: 0;
`;
