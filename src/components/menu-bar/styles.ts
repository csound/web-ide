import { css, SerializedStyles, Theme } from "@emotion/react";
import { headerHeight } from "@styles/constants";

export const root = (theme: Theme): SerializedStyles => css`
    color: ${theme.headerTextColor};
    font-size: 15px;
    display: inline-block;
    position: relative;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    list-style: none;
    padding: 0;
    margin: 0;
    user-select: none;
    margin-left: 12px;
    z-index: 200;

    @media (max-width: 900px) {
        margin-left: 6px;
    }
`;

export const mobileTopTriggerButton =
    (isActive: boolean) =>
    (theme: Theme): SerializedStyles => css`
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        margin: 0 8px 0 0;
        border: 1px solid ${theme.line};
        border-radius: 6px;
        color: ${theme.headerTextColor};
        background: ${isActive ? theme.buttonBackgroundHover : "transparent"};
        cursor: pointer;

        &:hover {
            background: ${theme.buttonBackgroundHover};
        }

        &:focus-visible {
            outline: 2px solid ${theme.highlightBackground};
            outline-offset: 2px;
        }
    `;

export const mobileDock = css`
    position: fixed;
    top: ${headerHeight + 4}px;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 200;
    display: flex;
    flex-direction: column;
    padding: 0 8px;
    pointer-events: none;
`;

export const mobileDockBackdrop = css`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 199;
    background: rgba(0, 0, 0, 0.4);
`;

export const mobileRail = (theme: Theme): SerializedStyles => css`
    pointer-events: auto;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 2px;
    padding: 6px;
    background: ${theme.headerBackground};
    border-radius: 0 0 12px 12px;
    border: 1px solid ${theme.line};
    border-top: 0;
    overflow-x: auto;
`;

export const mobileRailList = css`
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: row;
    gap: 2px;
    flex: 1;
`;

export const mobileRailButton =
    (isActive: boolean) =>
    (theme: Theme): SerializedStyles => css`
        border: 0;
        border-radius: 8px;
        padding: 8px 14px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 6px;
        color: ${theme.headerTextColor};
        background: ${isActive ? theme.buttonBackgroundHover : "transparent"};
        cursor: pointer;
        white-space: nowrap;
        font-size: 13px;
        font-weight: ${isActive ? 600 : 400};

        &:hover {
            background: ${theme.buttonBackgroundHover};
        }

        &:focus-visible {
            outline: 2px solid ${theme.highlightBackground};
            outline-offset: -2px;
        }
    `;

export const mobileRailIcon = css`
    display: inline-flex;
    align-items: center;
    justify-content: center;

    svg {
        font-size: 16px;
    }
`;

export const mobileRailText = css`
    font-size: 13px;
    line-height: 1;
`;

export const mobilePanel = (theme: Theme): SerializedStyles => css`
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - ${headerHeight + 80}px);
    max-height: calc(100dvh - ${headerHeight + 80}px);
    margin-top: 4px;
    border-radius: 12px;
    border: 1px solid ${theme.line};
    background: ${theme.headerBackground};
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.24);
`;

export const mobilePanelHeader = (theme: Theme): SerializedStyles => css`
    min-height: 52px;
    padding: 6px 8px;
    border-bottom: 1px solid ${theme.line};
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
`;

export const mobileBackButton = (theme: Theme): SerializedStyles => css`
    border: 0;
    background: transparent;
    color: ${theme.headerTextColor};
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px;
    border-radius: 8px;
    cursor: pointer;

    &:hover {
        background: ${theme.buttonBackgroundHover};
    }
`;

export const mobilePanelTitle = (theme: Theme): SerializedStyles => css`
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: ${theme.headerTextColor};
`;

export const mobilePanelList = css`
    list-style: none;
    margin: 0;
    padding: 6px;
    overflow-y: auto;
    min-height: 0;
`;

export const mobileBackItem = (theme: Theme): SerializedStyles => css`
    ${listItem(theme)}
    border-bottom: 1px solid ${theme.line};
    align-items: center;
`;

export const mobileBackIcon = (theme: Theme): SerializedStyles => css`
    color: ${theme.headerTextColor};
    margin-left: 0;
`;

export const selectedIcon = (theme: Theme): SerializedStyles => css`
    position: absolute;
    fill: ${theme.headerTextColor};
    height: auto;
    width: 18px;
    margin-top: 8px;
`;

export const nestedMenuIcon = (theme: Theme): SerializedStyles => css`
    ${selectedIcon(theme)}
    margin-top: 6px;
    right: 0px;
    zoom: 130%;
`;

export const paraLabel = css`
    margin: 6px 12px 6px 24px;
    font-size: 13px;
    white-space: nowrap;
`;

export const dropdownButtonWrapper = css`
    display: inline;
    margin-left: 6px;
    position: relative;
    z-index: 200;
`;

export const dropdownButton = (theme: Theme): SerializedStyles => css`
    z-index: 2;
    display: inline;
    border: 1px solid ${theme.line};
    border-radius: 6px;
    padding: 4px 10px;
    margin: 2px;
    transition: background-color 0.12s ease;
    &:hover {
        cursor: pointer;
        background-color: ${theme.buttonBackgroundHover};
        z-index: 3;
    }
    &:focus-visible {
        outline: 2px solid ${theme.highlightBackground};
        outline-offset: 2px;
    }
    & > span {
        font-size: 13px;
        font-weight: 500;
    }
`;

export const dropdownList = (theme: Theme): SerializedStyles => css`
    z-index: 200;
    width: fit-content;
    border: 1px solid ${theme.line};
    border-radius: 6px;
    background-color: ${theme.headerBackground};
    opacity: 1;
    position: absolute;
    list-style: none !important;
    padding: 4px 0;
    outline: 0;
    margin: 0;
    margin-top: 24px;
    left: 0;
    top: 5px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.24);

    @keyframes menuSlideFadeIn {
        from {
            opacity: 0;
            transform: translateY(-4px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

export const dropdownListNested = (theme: Theme): SerializedStyles => css`
    ${dropdownList(theme)}
    top: 0;
    left: 100%;
    margin: 0;
    transform: translate(4px, 0px);
`;

export const nestedWrapper = css`
    position: relative;
    z-index: 200;
`;

export const listItem = (theme: Theme): SerializedStyles => css`
    padding: 4px 12px;
    padding-right: 18px;
    width: 100%;
    display: flex;
    justify-content: space-between;
    background-color: ${theme.headerBackground};
    position: relative;
    border-radius: 4px;
    &:hover {
        cursor: pointer;
        background-color: ${theme.buttonBackgroundHover};
    }
    &:focus-visible {
        outline: 2px solid ${theme.highlightBackground};
        outline-offset: -2px;
        border-radius: 4px;
    }
    & > p,
    & span {
        display: block;
    }
`;

export const listItemDisabled = (theme: Theme): SerializedStyles => css`
    ${listItem(theme)}
    &:hover {
        cursor: initial;
        background-color: unset;
        box-shadow: unset;
    }
    & > p,
    & span,
    & i {
        color: ${theme.disabledTextColor};
    }
`;

export const iconButtonContainer = css`
    border-radius: 3px;
    padding: 2px 12px;
    justify-self: center;
`;
