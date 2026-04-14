import { css, SerializedStyles, Theme } from "@emotion/react";

export const dropdownContainer = (theme: Theme): SerializedStyles => css`
    position: relative;
    width: auto;
    height: 42px;
    margin-right: 4px;
    box-sizing: content-box;
    & > div {
        border: 1px solid ${theme.line};
        border-radius: 8px;
        &:hover {
            background-color: ${theme.buttonBackgroundHover};
        }
    }
`;

export const valueContainer = (): SerializedStyles => css`
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
    z-index: 200;
    position: absolute;
    border: 1px solid ${theme.line};
    border-radius: 6px;
    background-color: ${theme.headerBackground};
    min-width: 120px;
    width: 100%;
    margin-top: 6px;
    right: 0px;
    font-size: 13px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.24);
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

export const dropdownTooltip = (): SerializedStyles => css`
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
    text-decoration: none;
    color: ${theme.headerTextColor};
    font-size: 15px;
    padding: 0px;
    border: 1px solid ${theme.line};
    border-radius: 8px;
    cursor: default;
    & span {
        display: none;
    }
    & div:hover {
        background-color: ${theme.buttonBackgroundHover};
    }
    &:hover {
        cursor: pointer;
    }
`;

export const controlError = (theme: Theme): SerializedStyles => css`
    ${control(theme)}
    color: ${theme.errorText};
    border: 1px solid ${theme.errorText};
    &:hover {
        border: 1px solid ${theme.errorText};
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
    border: 1px solid ${theme.line};
    border-radius: 8px;
    height: 42px;
    width: 42px;
    margin-right: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transition: background-color 0.15s;
    &:hover {
        cursor: pointer;
        background-color: ${theme.buttonBackgroundHover};
    }
`;

export const playButtonLoadingSpinner = css`
    cursor: auto;
`;

export const playButtonStyle =
    (playing: boolean) =>
    (theme: Theme): SerializedStyles => css`
        border: 0;
        background: transparent;
        box-sizing: border-box;
        width: 0;
        height: 12px;
        cursor: pointer;
        border-color: transparent transparent transparent ${theme.buttonIcon};
        transition: 100ms all ease;

        // play state
        border-style: solid;
        border-width: 12px 0 12px 20px;

        ${playing &&
        `
cursor: pointer;
border-style: double;
border-width: 0px 0 0px 20px;
height: 26px;
`}
    `;

export const buttonContainer = (theme: Theme): SerializedStyles => css`
    position: relative;
    color: ${theme.headerTextColor};
    height: 42px;
    width: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    margin-right: 4px;
    line-height: 1;

    & > .Mui-disabled {
        opacity: 0.4;
    }

    button {
        border: 1px solid ${theme.line};
        border-radius: 8px;
        transition: background-color 0.15s;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        &:hover {
            cursor: pointer;
            background-color: ${theme.buttonBackgroundHover};
        }
        .Mui-disabled:hover {
            cursor: default !important;
        }
    }
`;

export const iconButton = (): SerializedStyles => css`
    border-radius: 8px;
    padding: 0 !important;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
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
    control: () => control(theme),
    container: () => dropdownContainerForDialog(theme),
    valueContainer: () => valueContainer,
    groupHeading: () => groupHeading,
    placeholder: () => placeholder,
    menu: () => menuForDialog(theme),
    menuList: () => menuList(theme),
    option: (_: unknown, { isDisabled }: { isDisabled: boolean }) =>
        isDisabled ? menuOptionDisabled(theme) : menuOption(theme),
    indicatorsContainer: () => indicatorContainer(theme),
    indicatorSeparator: () => indicatorSeparator
});
