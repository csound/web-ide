import { css, SerializedStyles, Theme } from "@emotion/react";
import { shadow } from "@styles/_common";

export const dropdownContainer = (theme: Theme): SerializedStyles => css`
    position: relative;
    width: auto;
    height: 42px;
    margin-right: 6px;
    box-sizing: content-box;
    & > div {
        border: 2px solid ${theme.highlightBackground};
        &:hover {
            border: 2px solid ${theme.line};
        }
    }
`;

export const valueContainer = (theme: Theme): SerializedStyles => css`
    padding: 0 6px;
    display: flex;
    width: 100%;
`;

export const dropdownContainerForDialog = (
    theme: Theme
): SerializedStyles => css`
    ${dropdownContainer(theme)}
    display: inline-flex;
    min-width: 180px;
    flex-direction: column;
    margin: 12px 0;
`;

export const menu = (theme: Theme): SerializedStyles => css`
    ${shadow}
    z-index: 2;
    position: absolute;
    border: 2px solid ${theme.line};
    border-radius: 6px;
    background-color: ${theme.headerBackground};
    min-width: 120px;
    width: 100%;
    margin-top: 6px;
    right: 0px;
    font-size: 14px;
    @keyframes dropIn {
        from,
        60%,
        75%,
        90%,
        to {
            animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
        }
        0% {
            opacity: 0;
            transform: translate3d(0, -120px, 0) scaleX(0.1) scaleY(0.1);
        }
        to {
            transform: translate3d(0, 0, 0) scaleX(1) scaleY(1);
        }
    }
    animation: dropIn 0.2s;
    & > div:last-child {
        text-align: center;
    }
    & > div > div:last-of-type {
        border-top: 2px solid ${theme.line};
        line-height: 42px !important;
    }
`;

export const dropdownTooltip = (theme: Theme): SerializedStyles => css`
    padding: 12px;
    & h4 {
        font-size: 15px;
        margin: 0;
        padding: 0;
    }
`;

export const menuList = (theme: Theme): SerializedStyles => css`
    & div {
        border-color: ${theme.highlightBackground}!important;
        background-color: ${theme.headerBackground}!important;
    }
`;

export const control = (theme: Theme): SerializedStyles => css`
    overflow: hidden;
    display: flex;
    height: 38px;
    width: auto;
    transition: width 2s;
    border-radius: 0;
    text-decoration: none;
    color: ${theme.headerTextColor};
    font-size: 15px;
    padding: 0px;
    border: 2px solid ${theme.highlightBackground};
    border-radius: 3px;
    cursor: default;
    ${shadow}
    & span {
        display: none;
    }
    & div:hover {
        background-color: ${theme.line};
    }
    &:hover {
        border: 2px solid ${theme.line};
        cursor: pointer;
    }
`;

export const controlError = (theme: Theme): SerializedStyles => css`
    ${control(theme)}
    color: ${theme.errorText};
    border: 2px solid ${theme.errorText};
    &:hover {
        border: 2px solid ${theme.errorText};
    }
`;

export const placeholder = (theme: Theme): SerializedStyles => css`
    color: ${theme.headerTextColor};
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 1.25px;
    white-space: nowrap;
    text-overflow: ellipsis;
    line-height: 1;
    align-self: center;
`;

export const menuOption = (theme: Theme): SerializedStyles => css`
    background-color: unset !important;
    font-size: 15px;
    line-height: 36px;
    outline: none;
    cursor: pointer;
    color: ${theme.headerTextColor};
    &:hover {
        background-color: ${theme.buttonBackgroundHover} !important;
    }
`;

export const menuOptionDisabled = (theme: Theme): SerializedStyles => css`
    ${menuOption(theme)}
    color: ${theme.disabledTextColor};
    cursor: initial;
    &:hover {
        background-color: unset !important;
    }
`;

export const groupHeading = (theme: Theme): SerializedStyles => css`
    text-transformation: none;
    cursor: default;
    line-height: 36px;
    margin: 0;
    color: ${theme.headerTextColor};
    font-size: 15px;
    font-weight: 500;
`;

export const indicatorContainer = (theme: Theme): SerializedStyles => css`
    background-color: ${theme.highlightBackground};
    width: 18px;
    & > div {
        color: ${theme.altTextColor} !important;
        padding: 0;
    }
    & svg {
        margin-left: 1px;
        margin-top: 8px;
        stroke-width: 2;
    }
`;

export const indicatorSeparator: SerializedStyles = css`
    color: white;
`;

export const playButtonContainer = (theme: Theme): SerializedStyles => css`
    position: relative;
    overflow: hidden;
    border: 2px solid ${theme.highlightBackground};
    border-radius: 3px;
    ${shadow}
    height: 100%;
    width: 42px;
    margin-right: 6px;
    &:hover {
        cursor: pointer;
        border: 2px solid ${theme.line};
        background-color: ${theme.buttonBackgroundHover};
    }
`;

export const playButtonLoadingSpinner = (theme: Theme): SerializedStyles => css`
    cursor: auto;
    margin-top: 6px;
    margin-left: 6px;
`;

export const playButtonStyle =
    (playing: boolean) =>
    (theme: Theme): SerializedStyles =>
        css`
            border: 0;
            background: transparent;
            box-sizing: border-box;
            width: 0;
            height: 12px;
            cursor: pointer;
            border-color: transparent transparent transparent
                ${theme.buttonIcon};
            transition: 100ms all ease;

            // play state
            margin-top: 6px;
            margin-left: 10px;
            border-style: solid;
            border-width: 12px 0 12px 20px;

            ${playing &&
            `
cursor: pointer;
border-style: double;
border-width: 0px 0 0px 20px;
height: 26px;
margin-top: 6px;
margin-left: 9px;
`}
        `;

export const buttonContainer = (theme: Theme): SerializedStyles => css`
    position: relative;
    top: 0;
    color: ${theme.headerTextColor};
    ${shadow}
    height: 42px;
    width: auto;
    margin: 0;
    margin-right: 6px;

    & > .Mui-disabled {
        opacity: 0.4;
    }

    button {
        border: 2px solid ${theme.highlightBackground};
        border-radius: 3px;
        &:hover {
            cursor: pointer;
            border: 2px solid ${theme.line};
            & > button {
                border-color: transparent transparent transparent ${theme.line};
            }
        }
        .Mui-disabled:hover {
            cursor: default !important;
        }
    }
`;

export const iconButton = (theme: Theme): SerializedStyles => css`
    border-radius: 0;
    padding: 2px;
`;

export const stopIcon = (theme: Theme): SerializedStyles => css`
    fill: ${theme.buttonIcon};
`;

export const closeIcon = (theme: Theme): SerializedStyles => css`
    position: absolute;
    background-color: ${theme.highlightBackground}!important;
    right: 50px;
    width: 24px;
    height: 24px;
    min-height: 24px;
    & span,
    svg {
        width: 15px;
    }
`;

export const menuForDialog = (theme: Theme): SerializedStyles => css`
    ${menu(theme)}
    top: 44px;
    margin: 0;
`;

export const reactSelectDropdownStyle = (theme: Theme) => ({
    control: (provided, state) => control(theme),
    container: (provided, state) => dropdownContainerForDialog(theme),
    valueContainer: (provided, state) => valueContainer(theme),
    groupHeading: (provided, state) => groupHeading,
    placeholder: (provided, state) => placeholder,
    menu: (provided, state) => menuForDialog(theme),
    menuList: (provided, state) => menuList(theme),
    option: (provided, { isDisabled }) =>
        isDisabled ? menuOptionDisabled(theme) : menuOption(theme),
    indicatorsContainer: (provided, state) => indicatorContainer(theme),
    indicatorSeparator: (provided, state) => indicatorSeparator
});
