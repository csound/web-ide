import { css } from "@emotion/core";
export const starButtonContainer = theme => css`
    position: relative;
    top: 0;
    border: 2px solid ${theme.highlight.primary};
    cursor: pointer;
    border-radius: 3px;
    box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.2);
    height: 42px;
    width: auto;
    margin: 0;
    margin-right: 6px;
    &:hover {
        cursor: pointer;
        border: 2px solid ${theme.highlightAlt.primary};
        & > button {
            border-color: transparent transparent transparent
                ${theme.highlightAlt.primary};
        }
    }
`;
