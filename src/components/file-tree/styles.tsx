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
    cursor: pointer;
    color: ${theme.textColor};
    width: 22px;
    height: 22px;
    z-index: 3;
    border-radius: 50%;
    background-clip: content-box;
    &:hover {
        background-color: ${theme.buttonBackgroundHover}!important;
        color: ${theme.buttonTextColorHover}!important;
    }
`;

export const deleteIcon = (theme: Theme): SerializedStyles => css`
    cursor: pointer;
    color: ${theme.textColor};
    width: 24px;
    height: 24px;
    z-index: 3;
    border-radius: 50%;
    background-clip: content-box;
    &:hover {
        background-color: ${theme.buttonBackgroundHover}!important;
        color: ${theme.buttonTextColorHover}!important;
    }
`;

export const delEditContainer = css`
    width: 38px;
    display: flex;
    justify-content: space-between;
    margin-top: 1px;
`;

export const headIconsContainer = (theme: Theme): SerializedStyles => css`
    position: absolute;
    right: 18px;
    margin-top: 2px;
    svg {
        font-size: 18px;
        :hover {
            fill: ${theme.textColor}!important;
        }
    }
    height: 20px;
    & span {
        cursor: pointer;
    }
`;

export const listContainer = css`
    margin-top: -3px;
`;

export const listItem = css`
    padding-left: 32px;
    display: flex;
    justify-content: space-between;
`;

export const draggingOver = (theme: Theme): SerializedStyles => css`
    ${listItem}
    & .MuiTouchRipple-root {
        background-color: rgba(${rgba(theme.allowed, 0.1)}) !important;
    }
`;

export const listItemIcon = css`
    position: absolute;
    min-width: 18px;
`;

export const listItemIconMui = css`
    ${listItemIcon}
    left: 12px;
    top: 4px;
`;

export const muiIcon = (theme: Theme): SerializedStyles => css`
    fill: ${theme.textColor} !important;
    width: 36px;
    height: 32px;
    margin-left: 1px;
`;

export const csoundFileIcon = css`
    svg {
        width: 28px;
        height: 28px;
    }
`;

export const newFolderIcon = css`
    margin-right: 12px;
`;

const musicIconBase = css`
    position: relative;
    width: 32px;
    height: 24px;
`;

export const mediaIcon = (theme: Theme): SerializedStyles => css`
    ${musicIconBase}
    margin-top: 1px;
    fill: ${theme.aRateVar};
`;

export const directoryCloseIcon = (theme: Theme): SerializedStyles => css`
    ${musicIconBase}
    width: 36px;
    height: 32px;
    margin-left: 2px;
    & > g > path:first-of-type {
        fill: ${theme.textColor};
    }
    & > g > path:last-of-type {
        fill: ${theme.highlightBackground};
    }
`;

export const directoryOpenIcon = css`
    ${musicIconBase}
    width: 36px;
    height: 32px;
`;

export const filenameStyle = (theme: Theme): SerializedStyles => css`
    font-family: ${theme.font.regular};
    font-size: 15px;
    font-weight: 400;
    color: ${theme.textColor};
    padding: 0;
    margin: 0;
    margin-left: 12px;
`;
