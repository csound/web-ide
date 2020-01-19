import { css as classCss } from "emotion";
import { css } from "@emotion/core";

const drawerWidth = 260;

export const headerRoot = theme => css`
    background-color: ${theme.headerBackground.primary};
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
    color: ${theme.color.black};
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
`;

export const loginButton = css`
    position: relative;
    right: 12px;
`;

export const accountTooltip = classCss`
    margin-right: 24px;
`;

export const headerRightSideGroup = css`
    position: absolute;
    right: 72px;
    height: 42px;
    top: 11px;
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