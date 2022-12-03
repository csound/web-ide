import { css, SerializedStyles, Theme } from "@emotion/react";
import { shadow } from "@styles/_common";

export const closeIcon = (theme: Theme): SerializedStyles => css`
    position: absolute;
    background-color: ${theme.highlightBackground}!important;
    right: 50px;
    width: 24px;
    height: 24px;
    min-height: 24px;
    & span,
    svg {
        width: 15px;
    }
`;

export const targetsDialog = (theme: Theme): SerializedStyles => css`
    min-width: 400px;
`;

export const targetsDialogMain = (theme: Theme): SerializedStyles => css`
    ${shadow}
    box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.8);
    margin-bottom: 12px;
    border: 2px solid ${theme.line};
    border-radius: 6px;
    padding: 12px;
`;

export const targetsDialogFooter = (theme: Theme): SerializedStyles => css`
    padding-top: 12px;
    & button {
        padding: 0 18px !important;
    }
    & svg {
        margin-left: 6px;
    }
`;

export const targetLabel = (theme: Theme): SerializedStyles => css`
    color: ${theme.altTextColor};
    position: absolute;
    font-size: 12px;
    font-weight: 400;
    line-height: 1;
    margin: 0;
    margin-top: -4px;
`;
