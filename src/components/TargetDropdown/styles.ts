import { css } from "@emotion/core";

export const dropdownContainer = css`
    position: relative;
    width: auto;
    margin-right: 24px;
`;

export const menu = css`
    background-color: #272822;
    box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.8);
    position: absolute;
    min-width: 120px;
    width: 100%;
    left: 1px;
`;

export const menuList = css`
    div {
        padding: 0px;
    }
`;

export const control = css`
    display: flex;
    height: 24px;
    width: auto;
    border-radius: 0;
    text-decoration: none;
    color: white;
    font-size: 11px;
    padding: 1px 7px;
    border: 1px solid #9c9c9c;
    margin: 2px 2px;
    border-radius: 3px;
    cursor: default;
    box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.2);
    & span {
        display: none;
    }
`;

export const placeholder = css`
    color: hsl(0, 0%, 80%);
    font-size: 13px;
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
    margin: 6px 0;
    margin-left: 12px;
`;
