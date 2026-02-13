import { css, SerializedStyles, Theme } from "@emotion/react";
import { shadow } from "@styles/_common";

export const closeButton = css`
    top: 10px;
    right: 8px;
    padding: 6px;
    position: absolute;
    z-index: 1;
`;

export const headIconsContainer = (theme: Theme): SerializedStyles => css`
    position: absolute;
    right: 16px;

    svg {
        font-size: 16px;
        color: ${theme.lineNumber}!important;
    }
    height: 36px;
    // height: 20px;
    & span {
        cursor: pointer;
        &:hover {
            svg {
                color: ${theme.textColor}!important;
            }
        }
    }
`;

export const mobileNavigationContainer = (
    theme: Theme
): SerializedStyles => css`
    background-color: ${theme.headerBackground};
    position: fixed;
    width: 100%;
    bottom: 0;
    z-index: 10;
    ${shadow};
    border-top: 1px solid;
`;

export const mobileNavigationButton = (theme: Theme): SerializedStyles => css`
    color: ${theme.headerTextColor};
`;

export const mobileNavigationButtonAwesome = (
    theme: Theme
): SerializedStyles => css`
    color: ${theme.headerTextColor};
    width: 28px !important;
    height: 28px !important;
    margin-top: 3px;
    margin-bottom: 5px;
`;

export const mobileConsole = (): SerializedStyles => css`
    height: calc(100vh - 130px);
`;

export const mobileManual = (): SerializedStyles => css`
    height: calc(100vh - 130px);
    & > div {
        padding: 0 !important;
        height: 100vh !important;
    }
`;

export const mobileFileTree = (): SerializedStyles => css`
    position: absolute;
    top: 28px;
    width: 100%;
    height: 100%;
    zoom: 120%;
    & > div {
        padding: 0 !important;
    }
    #web-ide-file-tree-header {
        display: none;
    }
`;

export const heightFix = css`
    height: 100%;
    min-height: 0;
    & > div {
        height: 100%;
        min-height: 0;
    }
    & > div > div:nth-of-type(2) {
        height: auto;
        min-height: 0;
    }
`;
