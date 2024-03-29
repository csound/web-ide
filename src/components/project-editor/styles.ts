import { css, SerializedStyles, Theme } from "@emotion/react";
import { shadow } from "@styles/_common";
import { headerHeight } from "@styles/constants";

export const splitterRoot = css`
    position: relative;
    width: 100vw;
    height: calc(100vh - ${headerHeight}px);
    top: 0;
    padding-top: ${headerHeight}px;
    left: 0;
    box-sizing: border-box;
    .Pane2 > div {
        height: 100%;
        width: 100%;
    }
`;

export const closeButton = css`
    top: 4px;
    right: 8px;
    padding: 6px;
    position: absolute;
    z-index: 10;
    span {
        pointer-events: none;
    }
`;

export const headIconsContainer = (theme: Theme): SerializedStyles => css`
    position: absolute;
    right: 16px;

    svg {
        font-size: 18px;
        color: ${theme.lineNumber}!important;
    }
    height: 36px;
    & span {
        cursor: pointer;
        &:hover {
            svg {
                fill: ${theme.textColor}!important;
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

export const mobileConsole = css`
    height: calc(100vh - 130px);
`;

export const mobileManual = css`
    height: calc(100vh - 130px);
    & > div {
        padding: 0 !important;
    }
`;

export const mobileFileTree = css`
    zoom: 140%;
    & > div {
        padding: 0 !important;
    }
`;
