import { css } from "@emotion/core";
export const starButtonContainer = theme => css`
    border: 2px solid ${theme.highlight.primary};
    cursor: pointer;
    border-radius: 3px;
    box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.2);
    height: 42px;
    width: 92px;
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
