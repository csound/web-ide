import { css } from "@emotion/core";
import { shadow } from "@styles/_common";

export const splitterLayoutContainer = css`
    width: 100%;
    height: calc(100vh - 64px);

    position absolute;
    bottom: 0;
    .layout-pane {
        overflow: hidden;
    }
    .layout-pane-primary > div {
        height: 100%;
    }
    & > div {
        height: 100%;
        bottom: 0;
    }
    .panel-with-tab-dock {
        & > div {position: relative; overflow:unset;}
        & > div > div {
          overflow: hidden;
        }
        & > div > div > div:first-of-type {
          height: 45px;
        }
        & > div > div > div:last-of-type {
          height: calc(100% - 45px);
          min-height: 360px;
          width: 100%;
          position: relative;
        }
}
`;

export const closeButton = css`
    top: 10px;
    right: 8px;
    padding: 6px;
    position: absolute;
    z-index: 1;
`;

export const headIconsContainer = theme => css`
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

export const mobileNavigationContainer = theme => css`
    background-color: ${theme.headerBackground};
    position: absolute;
    width: 100%;
    bottom: 0;
    z-index: 10;
    ${shadow};
    border-top: 1px solid;
`;

export const mobileNavigationButton = theme => css`
    color: ${theme.headerTextColor};
`;

export const mobileNavigationButtonAwesome = theme => css`
    color: ${theme.headerTextColor};
    width: 28px !important;
    height: 28px !important;
    margin-top: 3px;
    margin-bottom: 5px;
`;

export const mobileConsole = theme => css`
    height: calc(100vh - 130px);
`;

export const mobileManual = theme => css`
    height: calc(100vh - 130px);
    & > div {
        padding: 0 !important;
    }
`;

export const mobileFileTree = theme => css`
    zoom: 140%;
    & > div {
        padding: 0 !important;
    }
`;
