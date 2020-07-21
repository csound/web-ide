import { css as classCss } from "emotion";
import { css } from "@emotion/core";
import { shadow } from "@styles/_common";

const drawerWidth = 260;

export const headerRoot = theme => css`
    height: 64px;
    background-color: ${theme.headerBackground};
    & > div {
       height 64px;
    }
`;

export const drawer = css`
    width: ${drawerWidth};
`;

export const drawerHeader = css`
    width: ${drawerWidth};
    padding-left: 16px;
    height: 40px;
`;

export const menuButton = css`
    margin-left: 12px;
    margin-right: 6px;
`;

export const menuItemLink = theme => css`
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

export const menuPaper = classCss`
    top: 60px!important;
    padding: 0!important;
`;

export const loginButton = css`
    position: relative;
    right: 12px;
    margin-left: 12px;
`;

export const accountTooltip = classCss`
    margin-right: 24px;
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
    height: 64px;
    width: 100%;
`;

export const projectProfileMetaContainer = css`
    display: flex;
    flex-direction: row;
`;

export const projectProfileMetaTextContainer = theme => css`
    align-self: center;
    font-family: ${theme.font.regular};
    display: flex;
    flex-direction: column;
`;

export const projectProfileMetaH1 = theme => css`
    color: ${theme.headerTextColor};
    font-weight: 500;
    font-size: 16px;
    padding: 0;
    margin: 0;
`;

export const projectProfileBySpan = theme => css`
    color: ${theme.altTextColor};
`;

export const projectProfileLink = theme => css`
    color: ${theme.headerTextColor};
    text-decoration: underline;
`;

export const projectProfileMetaP = theme => css`
    color: ${theme.headerTextColor};
    font-weight: 400;
    font-size: 13px;
    padding: 0;
    margin: 0;
`;

export const projectIcon = css`
    & > div {
        box-sizing: content-box;
        height: 34px;
        width: 34px;
        padding: 5px;
        margin: 0 9px;
        cursor: default;
        & svg {
            height: 20px !important;
            width: 20px !important;
            margin-top: 7px;
            margin-left: 7px;
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

export const buttonContainer = theme => css`
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
