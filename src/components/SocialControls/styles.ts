import { css } from "@emotion/core";
import { shadow } from "@styles/_common";

export const buttonContainer = theme => css`
    position: relative;
    top: 0;
    color: ${theme.headerTextColor};
    border: 2px solid ${theme.line};
    cursor: pointer;
    border-radius: 3px;
    ${shadow}
    height: 42px;
    width: auto;
    margin: 0;
    margin-right: 6px;
    &:hover {
        cursor: pointer;
        border: 2px solid ${theme.lineColorHover};
        & > button {
            border-color: transparent transparent transparent
                ${theme.lineColorHover};
        }
    }
`;
