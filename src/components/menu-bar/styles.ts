import { css, SerializedStyles, Theme } from "@emotion/react";
import { shadow } from "@styles/_common";

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
    z-index: 1;
`;

export const mobileMenuButton = (theme: Theme): SerializedStyles => css`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: 2px solid ${theme.line};
    border-radius: 6px;
    padding: 6px 10px;
    margin: 2px;
    cursor: pointer;
    color: ${theme.headerTextColor};
    ${shadow}
    transition:
        transform 0.18s ease,
        background-color 0.18s ease,
        box-shadow 0.18s ease;

    &:hover {
        background-color: ${theme.buttonBackgroundHover};
        transform: translateY(-1px);
    }

    &:focus-visible {
        outline: 2px solid ${theme.highlightBackground};
        outline-offset: 2px;
    }

    span {
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 1px;
        line-height: 1;
    }
`;

export const mobileMenuIcon = (theme: Theme): SerializedStyles => css`
    color: ${theme.headerTextColor};
`;

export const mobileDropdownList = (theme: Theme): SerializedStyles => css`
    ${dropdownList(theme)}
    position: fixed;
    top: 56px;
    left: 8px;
    right: 8px;
    width: auto;
    max-height: calc(100vh - 72px);
    overflow-y: auto;
    margin-top: 0;
`;

export const mobileBackItem = (theme: Theme): SerializedStyles => css`
    ${listItem(theme)}
    border-bottom: 1px solid ${theme.line};
    align-items: center;
`;

export const mobileBackIcon = (theme: Theme): SerializedStyles => css`
    color: ${theme.headerTextColor};
    margin-left: 6px;
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
    margin: 9px 12px 9px 24px;
    font-size: 14px;
    white-space: nowrap;
`;

export const dropdownButtonWrapper = css`
    display: inline;
    margin-left: 6px;
    position: relative;
`;

export const dropdownButton = (theme: Theme): SerializedStyles => css`
    ${shadow}
    z-index: 2;
    display: inline;
    border: 2px solid ${theme.line};
    border-radius: 6px;
    padding: 4px 8px;
    margin: 2px;
    transition:
        background-color 0.16s ease,
        transform 0.16s ease;
    &:hover {
        cursor: pointer;
        background-color: ${theme.buttonBackgroundHover};
        z-index: 3;
        transform: translateY(-1px);
    }
    &:focus-visible {
        outline: 2px solid ${theme.highlightBackground};
        outline-offset: 2px;
    }
    & > span {
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 1.25px;
    }
`;

export const dropdownList = (theme: Theme): SerializedStyles => css`
    z-index: 20000;
    width: fit-content;
    border: 2px solid ${theme.line};
    border-radius: 6px;
    background-color: ${theme.headerBackground};
    opacity: 1;
    position: absolute;
    list-style: none !important;
    padding: 0;
    animation: menuSlideFadeIn 0.16s ease;
    outline: 0;
    margin: 0;
    margin-top: 24px;
    left: 0;
    top: 5px;
    ${shadow}

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
`;

export const listItem = (theme: Theme): SerializedStyles => css`
    padding: 2px 12px;
    padding-right: 18px;
    width: 100%;
    display: flex;
    justify-content: space-between;
    background-color: ${theme.headerBackground};
    position: relative;
    &:hover {
        cursor: pointer;
        background-color: ${theme.buttonBackgroundHover};
        border-radius: 2px;
        ${shadow};
    }
    &:focus-visible {
        outline: 2px solid ${theme.highlightBackground};
        outline-offset: -2px;
        border-radius: 2px;
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
