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
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 30000;
    width: min(360px, calc(100vw - 32px));
    border-radius: 14px;
    padding: 10px 12px;
`;

export const projectProfileMetaTextContainer = (
    theme: Theme
): SerializedStyles => css`
    align-self: flex-start;
    font-family: ${theme.font.regular};
    display: flex;
    flex-direction: column;
    border: 1px solid ${theme.line};
    background-color: ${theme.headerBackground};
    border-radius: 12px;
    padding: 8px;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
`;

export const projectProfileMetaH1 = (theme: Theme): SerializedStyles => css`
    color: ${theme.headerTextColor};
    font-weight: 500;
    font-size: 14px;
    padding: 0;
    margin: 0;
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const projectProfileDescription = (
    theme: Theme
): SerializedStyles => css`
    color: ${theme.altTextColor};
    font-weight: 300;
    font-size: 11px;
    line-height: 1.35;
    padding: 0;
    margin: 4px 0 0 0;
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
    font-size: 12px;
    padding: 0;
    margin: 1px 0 0 0;
`;

export const projectIcon = css`
    position: relative;
    width: 30px;
    height: 30px;
    bottom: 0;
    right: 0;
    & > div {
        box-sizing: content-box;
        height: 100%;
        width: 100%;
        padding: 2px;
        margin: 0;
        cursor: default;
        border-radius: 100%;
        & svg {
            height: 16px !important;
            width: 16px !important;
            margin-top: 0;
            margin-left: 0;
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
    width: 36px;
    min-width: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    & > div,
    svg {
        width: 34px;
        height: 34px;
        border-radius: 6px;
    }
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

export const projectProfileTopRow = css`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const projectProfileTextBlock = css`
    display: flex;
    flex-direction: column;
    min-width: 0;
`;

export const projectProfileCollapseButton = (theme: Theme): SerializedStyles =>
    css`
        margin-left: auto !important;
        color: ${theme.altTextColor} !important;
        padding: 2px !important;
    `;

export const projectProfileDetails = css`
    margin-top: 8px;
`;

export const projectProfileAuthorRow = css`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const projectProfileLinks = css`
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
`;

export const projectProfileExternalLink = (theme: Theme): SerializedStyles =>
    css`
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        text-decoration: none;
        color: ${theme.headerTextColor};
        border: 1px solid ${theme.line};
        padding: 3px 6px;
        border-radius: 999px;
        background: ${theme.buttonBackground};

        svg {
            font-size: 11px;
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
