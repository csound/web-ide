import { css } from "@emotion/core";

export const dropdownContainer = css`
    position: relative;
    width: auto;
    height: 42px;
    margin-right: 18px;
    padding-bottom: 5px;
    box-sizing: content-box;
`;

export const menu = css`
    z-index: 2;
    background-color: #272822;
    box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.8);
    position: absolute;
    min-width: 120px;
    width: 100%;
    margin-bottom: -6px;
    right: 0px;
    font-size: 16px;

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
`;

export const menuList = css`
    div {
        padding: 0px;
    }
`;

export const control = css`
    overflow: hidden;
    display: flex;
    height: 38px;
    width: auto;
    border-radius: 0;
    text-decoration: none;
    color: white;
    font-size: 16px;
    padding: 0px;
    border: 2px solid #9c9c9c;
    margin: 2px 2px;
    border-radius: 3px;
    cursor: default;
    box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.2);
    & span {
        display: none;
    }
    &:hover {
        cursor: pointer;
        filter: sepia(0.2);
    }
`;

export const placeholder = css`
    color: hsl(0, 0%, 80%);
    font-size: 16px;
    line-height: 12px;
`;

export const menuOption = css`
    background-color: unset !important;
    padding: 6px 12px !important;
    padding-left: 24px !important;
    outline: none;
    cursor: pointer;
    color: hsl(0, 0%, 80%);
    &:hover {
        background-color: hsl(0, 0%, 10%) !important;
        color: white;
    }
`;

export const groupHeading = css`
    text-transformation: none;
    cursor: default;
    height: 38px;
    margin: 0;
    padding: 6px 6px 12px 20px !important;
    color: hsl(0, 0%, 80%);
    font-size: 18px;
    font-weight: 500;
`;

export const indicatorContainer = css`
    background-color: #9c9c9c;
    width: 18px;
    & > div {
        padding: 0;
    }
    & > div:hover {
        color: hsl(0, 0%, 80%) !important;
    }
    & svg {
        margin-left: 1px;
        margin-top: 8px;
        stroke-width: 2;
    }
`;

export const indicatorSeparator = css`
    color: white;
`;

export const playButtonContainer = css`
    border: 2px solid #9c9c9c;
    border-radius: 3px;
    box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.2);
    height: 42px;
    width: 42px;
    margin-right: 6px;
    &:hover {
        filter: sepia(0.2);
    }
`;

export const playButtonStyle = (playing: boolean) => css`
    border: 0;
    background: transparent;
    box-sizing: border-box;
    width: 0;
    height: 12px;

    border-color: transparent transparent transparent #9c9c9c;
    transition: 100ms all ease;
    cursor: pointer;

    // play state
    margin-top: 4px;
    margin-left: 8px;
    border-style: solid;
    border-width: 14px 0 14px 22px;

    ${playing &&
        `
border-style: double;
border-width: 0px 0 0px 20px;
height: 26px;
margin-top: 6px;
margin-left: 9px;
`}
`;
