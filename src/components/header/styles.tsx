// import { css as classCss } from "@emotion/react";
import { css, SerializedStyles, Theme } from "@emotion/react";
import { shadow } from "@styles/_common";
import { headerHeight } from "@styles/constants";

const drawerWidth = 260;

export const headerRoot = (theme: Theme): SerializedStyles => css`
    height: ${headerHeight}px;
    background-color: ${theme.headerBackground};
    z-index: 3;
    & > div {
       height ${headerHeight}px;
    }
    font-family: ${theme.font.regular};
    /* because of mui's <Menu> */
    padding: 0!important;
`;

export const drawer = css`
    width: ${drawerWidth};
`;

export const drawerHeader = (theme: Theme): SerializedStyles => css`
    width: ${drawerWidth};
    padding-left: 16px;
    height: 40px;
    color: ${theme.textColor};
`;

export const menuButton = css`
    margin-left: 12px;
    margin-right: 6px;
`;

export const menuItemLink = css`
    text-decoration: none;
`;

export const toolbar = css`
    display: flex;
    justify-content: space-between;
`;

export const avatar = css`
    height: 42px;
    width: 42px;
    padding: 0 !important;
    margin-right: 6px;
    border-radius: 4px;
`;

export const userMenu = css`
    position: static;
    margin-right: 12px;
    & > button {
        padding: 0 !important;
    }
`;

export const menuPaper = css`
    top: 52px !important;
    padding: 0 !important;
`;

export const loginButton = css`
    position: relative;
    right: 12px;
    margin-left: 12px;
`;

export const accountTooltip = css`
    margin-right: 24px;
`;

export const projectProfileTooltipTitleContainer = css`
    display: flex;
    justify-content: space-between;
    padding-right: 12px;
`;

export const headerRightSideGroup = css`
    position: relative;
    right: 0px;
    top: 0px;
    height: 42px;
    display: flex;
    justify-content: space-between;

    & > div {
        height: 42px;
        margin: 0;
        margin-right: 6px;
        display: inline;
        vertical-align: middle;
    }
`;

export const spacer = css`
    margin-left: 12px;
`;

export const clearfixHeader = css`
    position: relative;
    height: ${headerHeight}px;
    width: 100%;
`;

export const projectProfileMetaContainer = css`
    display: flex;
    flex-direction: row;
    margin-left: 12px;
`;

export const projectProfileMetaTextContainer = (
    theme: Theme
): SerializedStyles => css`
    align-self: center;
    font-family: ${theme.font.regular};
    display: flex;
    flex-direction: column;
`;

export const projectProfileMetaH1 = (theme: Theme): SerializedStyles => css`
    color: ${theme.headerTextColor};
    font-weight: 500;
    font-size: 16px;
    padding: 0;
    margin: 0;
`;

export const projectProfileDescription = (
    theme: Theme
): SerializedStyles => css`
    color: ${theme.altTextColor};
    font-weight: 300;
    font-size: 12px;
    padding: 0;
    margin: 0;
`;

export const projectProfileBySpan = (theme: Theme): SerializedStyles => css`
    color: ${theme.altTextColor};
`;

export const projectProfileLink = (theme: Theme): SerializedStyles => css`
    color: ${theme.headerTextColor};
    text-decoration: underline;
`;

export const projectProfileMetaP = (theme: Theme): SerializedStyles => css`
    color: ${theme.headerTextColor};
    font-weight: 400;
    font-size: 13px;
    padding: 0;
    margin: 0;
`;

export const projectIcon = css`
    position: relative;
    width: 36px;
    height: 36px;
    bottom: 2px;
    right: 6px;
    & > div {
        box-sizing: content-box;
        height: 100%;
        width: 100%;
        padding: 5px;
        margin: 0 9px;
        cursor: default;
        border-radius: 100%;
        & svg {
            height: 20px !important;
            width: 20px !important;
            margin-top: 1px;
            margin-left: 1px;
        }
    }
`;

export const projectProfileTooltipContainer = css`
    display: flex;
    flex-direction: row;
`;

export const projectProfileImgContainer = css`
    height: 100%;
    align-self: center;
`;

export const projectProfileTooltip = css`
    margin-left: 12px;
    & > h2 {
        font-size: 16px;
        font-weight: 500;
        padding: 3px 0;
        margin: 0;
    }
    & > p {
        font-size: 12px;
        margin: 0;
    }
`;

export const drawerIcon = css`
    fill: #fff;
`;

export const buttonContainer = (theme: Theme): SerializedStyles => css`
    position: relative;
    top: 0;
    color: ${theme.headerTextColor};
    border: 2px solid ${theme.highlightBackground};
    cursor: pointer;
    border-radius: 3px;
    ${shadow}
    height: 42px;
    width: auto;
    margin: 0;
    margin-left: 6px;
    &:hover {
        cursor: pointer;
        border: 2px solid ${theme.line};
        & > button {
            border-color: transparent transparent transparent ${theme.line};
        }
    }
`;
