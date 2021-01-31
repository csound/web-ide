import { css, SerializedStyles, Theme } from "@emotion/react";
import { rgba } from "@styles/utils";

export const container = (theme: Theme): SerializedStyles => css`
    width: 100%;
    height: 100%;
    background-color: ${theme.fileTreeBackground};
    color: ${theme.textColor} !important;
    margin-top: 32px;
`;

export const fileIcon = (theme: Theme): SerializedStyles => css`
    z-index: 0;
    margin-right: 6px;
    color: ${theme.textColor};
    align-self: center;
    position: absolute;
    width: 20px;
    top: -3px;
    left: -18px;
    pointer-events: none;
`;

export const editIcon = (theme: Theme): SerializedStyles => css`
    position: absolute;
    cursor: pointer;
    color: ${theme.textColor};
    width: 16px;
    height: 16px;
    z-index: 2;
    right: 36px;
    margin-top: -22px;
    border-radius: 50%;
    background-clip: content-box;
    border-radius: 50%;
    background-clip: content-box;
    &:hover {
        background-color: ${theme.buttonBackgroundHover}!important;
        color: ${theme.buttonTextColorHover}!important;
    }
`;

export const deleteIcon = (theme: Theme): SerializedStyles => css`
    position: absolute;
    cursor: pointer;
    color: ${theme.textColor};
    width: 18px;
    height: 18px;
    z-index: 2;
    right: 12px;
    margin-top: -23px;
    border-radius: 50%;
    background-clip: content-box;
    &:hover {
        background-color: ${theme.buttonBackgroundHover}!important;
        color: ${theme.buttonTextColorHover}!important;
    }
`;

export const headIconsContainer = (theme: Theme): SerializedStyles => css`
    position: absolute;
    right: 16px;

    svg {
        font-size: 16px;
    }
    height: 20px;
    & span {
        cursor: pointer;
        &:hover {
            svg {
                color: ${theme.textColor}!important;
            }
        }
    }
`;

export const listContainer = (theme: Theme): SerializedStyles => css`
    margin-top: -3px;
`;

export const listItem = (theme: Theme): SerializedStyles => css`
    padding-left: 32px;
`;

export const draggingOver = (theme: Theme): SerializedStyles => css`
    ${listItem(theme)}
    & .MuiTouchRipple-root {
        background-color: rgba(${rgba(theme.allowed, 0.1)}) !important;
    }
`;

export const listItemIcon = (theme: Theme): SerializedStyles => css`
    top: 6px;
    left: 22px;
    position: absolute;
`;

export const listItemIconMui = (theme: Theme): SerializedStyles => css`
    ${listItemIcon(theme)}
    left: 12px;
    top: 4px;
`;

export const muiIcon = (theme: Theme): SerializedStyles => css`
    fill: ${theme.textColor} !important;
    width: 16px;
    height: 16px;
    margin-top: 2px;
`;

export const newFolderIcon = (theme: Theme): SerializedStyles => css`
    margin-right: 12px;
`;

const musicIconBase = (theme: Theme): SerializedStyles => css`
    position: absolute;
    width: 32px;
    height: 24px;
    left: -18px;
    top: -6px;
`;

export const mediaIcon = (theme: Theme): SerializedStyles => css`
    ${musicIconBase(theme)}
    margin-top: 2px;
    zoom: 90%;
    fill: ${theme.aRateVar};
`;

export const directoryCloseIcon = (theme: Theme): SerializedStyles => css`
    ${musicIconBase(theme)}
    & > g > path:first-of-type {
        fill: ${theme.textColor};
    }
    & > g > path:last-of-type {
        fill: ${theme.highlightBackground};
    }
`;

export const directoryOpenIcon = (theme: Theme): SerializedStyles => css`
    ${musicIconBase(theme)}
`;

export const filenameStyle = (theme: Theme): SerializedStyles => css`
    font-family: ${theme.font.regular};
    font-size: 15px;
    font-weight: 400;
    color: ${theme.textColor};
    padding: 0;
    margin: 0;
`;
