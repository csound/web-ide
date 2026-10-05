import { css, SerializedStyles, Theme } from "@emotion/react";

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
    @media (max-width: 600px) {
        margin-left: 0;
    }
`;

export const mobileTopTriggerButton =
    (isActive: boolean) =>
    (theme: Theme): SerializedStyles => css`
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        margin: 0 8px 0 0;
        @media (max-width: 600px) {
            margin-right: 0;
        }
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

export const mobileDialog = (theme: Theme): SerializedStyles => css`
    .MuiDialog-container {
        align-items: flex-start;
    }
    .MuiDialog-paper {
        margin: max(12px, env(safe-area-inset-top))
            max(12px, env(safe-area-inset-right))
            max(12px, env(safe-area-inset-bottom))
            max(12px, env(safe-area-inset-left));
        width: 480px;
        @media (min-width: 600px) and (max-height: 500px) {
            width: 600px;
        }
        max-width: calc(100% - 24px);
        max-height: calc(
            100dvh -
                24px - env(safe-area-inset-top) - env(safe-area-inset-bottom)
        );
        border: 1px solid ${theme.line};
        border-radius: 8px;
        background: ${theme.headerBackground};
        color: ${theme.headerTextColor};
        background-image: none;
        overflow: hidden;
    }
`;

export const mobileRail = (theme: Theme): SerializedStyles => css`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 4px;
    padding: 8px;
    flex-shrink: 0;
    border-bottom: 1px solid ${theme.line};
    @media (min-width: 600px) and (max-height: 500px) {
        grid-template-columns: repeat(6, minmax(0, 1fr));
    }
`;

export const mobileRailButton =
    (isActive: boolean) =>
    (theme: Theme): SerializedStyles => css`
        border: 1px solid ${isActive ? theme.lineHover : "transparent"};
        border-radius: 6px;
        min-height: 44px;
        padding: 8px 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        color: ${theme.headerTextColor};
        background: ${isActive ? theme.buttonBackgroundHover : "transparent"};
        cursor: pointer;
        font: inherit;
        font-size: 13px;
        font-weight: ${isActive ? 600 : 400};
        svg {
            font-size: 18px;
        }
        &:hover {
            background: ${theme.buttonBackgroundHover};
        }
        &:focus-visible {
            outline: 2px solid ${theme.headerTextColor};
            outline-offset: -2px;
        }
    `;

export const mobilePanelHeader = (theme: Theme): SerializedStyles => css`
    min-height: 48px;
    padding: 2px 12px;
    flex-shrink: 0;
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
    gap: 8px;
    min-width: 44px;
    min-height: 44px;
    justify-content: center;
    padding: 8px;
    border-radius: 6px;
    font: inherit;
    font-size: 14px;
    cursor: pointer;
    &:hover {
        background: ${theme.buttonBackgroundHover};
    }
    &:focus-visible {
        outline: 2px solid ${theme.headerTextColor};
        outline-offset: -2px;
    }
`;

export const mobilePanelTitle = css`
    margin: 0;
    font-size: 14px;
    font-weight: 600;
`;

export const mobilePanelList = css`
    list-style: none;
    margin: 0;
    padding: 4px 8px 8px;
    overflow-y: auto;
    overscroll-behavior: contain;
    min-height: 0;
`;

export const mobileMenuAction = (theme: Theme): SerializedStyles => css`
    width: 100%;
    min-height: 44px;
    padding: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: ${theme.headerTextColor};
    text-align: left;
    font: inherit;
    font-size: 14px;
    cursor: pointer;
    > span:nth-of-type(2) {
        flex: 1;
    }
    svg {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
    }
    &:hover {
        background: ${theme.buttonBackgroundHover};
    }
    &:disabled {
        color: ${theme.disabledTextColor};
        background: transparent;
        cursor: default;
    }
    &:focus-visible {
        outline: 2px solid ${theme.headerTextColor};
        outline-offset: -2px;
    }
`;

export const mobileCheck = css`
    display: inline-flex;
    width: 20px;
    flex-shrink: 0;
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
