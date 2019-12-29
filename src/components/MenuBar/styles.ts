import { css } from "@emotion/core";

export const root = theme => css`
    color: ${theme.color.primary};
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

export const hr = theme => css`
    padding: 0;
    background-color: ${theme.highlight.primary};
    height: 2px;
    border: none;
    margin-top: 12px;
    margin-bottom: 12px;
`;

export const paraLabel = css`
    margin: 0;
    white-space: nowrap;
`;

export const dropdownButtonWrapper = css`
    display: inline;
    margin-left: 6px;
    position: relative;
`;

export const dropdownButton = theme => css`
    z-index: 2;
    display: inline;
    border: 2px solid ${theme.highlight.primary};
    border-radius: 6px;
    padding: 5px 9px;
    &:hover {
        cursor: pointer;
        background-color: ${theme.highlightAlt.primary};
        box-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 0.2),
            0px 4px 5px 0px rgba(0, 0, 0, 0.14),
            0px 1px 10px 0px rgba(0, 0, 0, 0.12);
    }
    & > span {
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 1.25px;
    }
`;

export const dropdownList = theme => css`
    z-index: 10000;
    width: fit-content;
    border: 2px solid ${theme.highlight.primary};
    border-radius: 6px;
    background-color: ${theme.background.primary};
    opacity: 1;
    position: absolute;
    list-style: none !important;
    padding: 12px;
    animation: fadeIn 0.01s linear;
    outline: 0;
    margin: 0;
    margin-top: 24px;
    left: 0;
    top: 5px;
    box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.8);
`;

export const buttonGroup = css`
    display: none;
`;

export const iconButtonContainer = css`
    border-radius: 3px;
    padding: 2px 12px;
    justify-self: center;
`;

export const listItem = theme => css`
    padding: 6px 12px;
    width: 100%;
    display: flex;
    justify-content: space-between;
    background-color: ${theme.background.primary};
    &:hover {
        pointer: cursor;
        cursor: pointer;
        background-color: ${theme.highlightAlt.primary};
        border-radius: 2px;
        box-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 0.2),
            0px 4px 5px 0px rgba(0, 0, 0, 0.14),
            0px 1px 10px 0px rgba(0, 0, 0, 0.12);
    }
`;
