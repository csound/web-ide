import { css } from "@emotion/core";

export const hr = theme => css`
    padding: 0;
    background-color: ${theme.highlight.primary};
    height: 2px;
    border: none;
    margin: 0;
`;

export const windowHeader = theme => css`
    background-color: ${theme.highlightAlt.primary};
    box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.8);
    top: 0;
    position: absolute;
    width: 100%;
    height: 36px;
    display: flex;
    justify-content: center;
    align-content: center;
    flex-direction: column;
    & p {
        margin: 0;
        margin-left: 12px;
        color: ${theme.lineNumber.primary};
    }
`;
