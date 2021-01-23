import { css } from "@emotion/react";
import { shadow } from "@styles/_common";

export const root = (theme) => css`
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
`;

export const selectedIcon = (theme) => css`
    position: absolute;
    fill: ${theme.headerTextColor};
    height: auto;
    width: 18px;
    margin-top: 8px;
`;

export const nestedMenuIcon = (theme) => css`
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

export const dropdownButton = (theme) => css`
    $[shadow];
    z-index: 2;
    display: inline;
    border: 2px solid ${theme.line};
    border-radius: 6px;
    padding: 5px 9px;
   margin: 2px;
    &:hover {
        cursor: pointer;
        background-color: ${theme.buttonBackgroundHover};
        z-index: 3;
    }
    & > span {
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 1.25px;
    }
`;

export const dropdownList = (theme) => css`
    z-index: 10000;
    width: fit-content;
    border: 2px solid ${theme.line};
    border-radius: 6px;
    background-color: ${theme.headerBackground};
    opacity: 1;
    position: absolute;
    list-style: none !important;
    padding: 0;
    animation: fadeIn 0.01s linear;
    outline: 0;
    margin: 0;
    margin-top: 24px;
    left: 0;
    top: 5px;
    ${shadow}
`;

export const dropdownListNested = (theme) => css`
    ${dropdownList(theme)}
    top: 0;
    left: 100%;
    margin: 0;
    transform: translate(4px, 0px);
`;

export const nestedWrapper = css`
    position: relative;
`;

export const listItem = (theme) => css`
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
    & > p,
    span {
        display: block;
    }
`;

export const listItemDisabled = (theme) => css`
    ${listItem(theme)}
    &:hover {
        cursor: initial;
        background-color: unset;
        box-shadow: unset;
    }
    & > p,
    span,
    i {
        color: ${theme.disabledTextColor};
    }
`;

export const iconButtonContainer = css`
    border-radius: 3px;
    padding: 2px 12px;
    justify-self: center;
`;
