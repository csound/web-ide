import { css } from "@emotion/core";
import { rgba } from "@styles/utils";

export const container = theme => css`
    width: 100%;
    height: 100%;
    background-color: ${theme.fileTreeBackground.primary};
    color: ${theme.color.primary} !important;
    margin-top: 32px;
`;

export const fileIcon = theme => css`
    z-index: 0;
    margin-right: 6px;
    color: ${theme.color.primary};
    align-self: center;
    position: absolute;
    width: 20px;
    top: -3px;
    left: -18px;
    pointer-events: none;
`;

export const editIcon = theme => css`
    position: absolute;
    cursor: pointer;
    color: ${theme.color.primary};
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
        background-color: ${theme.buttonHover.primary}!important;
        color: ${theme.alternativeColor.primary}!important;
    }
`;

export const deleteIcon = theme => css`
    position: absolute;
    cursor: pointer;
    color: ${theme.color.primary};
    width: 18px;
    height: 18px;
    z-index: 2;
    right: 12px;
    margin-top: -23px;
    border-radius: 50%;
    background-clip: content-box;
    &:hover {
        background-color: ${theme.buttonHover.primary}!important;
        color: ${theme.alternativeColor.primary}!important;
    }
`;

export const headIconsContainer = theme => css`
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
                color: ${theme.color.primary}!important;
            }
        }
    }
`;

export const listContainer = theme => css`
    margin-top: -3px;
`;

export const listItem = theme => css`
    padding-left: 32px;
`;

export const draggingOver = theme => css`
    ${listItem(theme)}
    & .MuiTouchRipple-root {
        background-color: rgba(${rgba(theme.allowed.primary, 0.1)}) !important;
    }
`;

export const listItemIcon = theme => css`
    top: 6px;
    left: 22px;
    position: absolute;
`;

export const listItemIconMui = theme => css`
    ${listItemIcon(theme)}
    left: 12px;
    top: 4px;
`;

export const muiIcon = theme => css`
    fill: ${theme.color.primary} !important;
    width: 16px;
    height: 16px;
`;

export const newFolderIcon = theme => css`
    margin-right: 12px;
`;

const musicIconBase = theme => css`
    position: absolute;
    width: 32px;
    height: 24px;
    left: -18px;
    top: -6px;
`;

export const mediaIcon = theme => css`
    ${musicIconBase(theme)}
    margin-top: 2px;
    zoom: 90%;
    fill: ${theme.aRateVar.primary};
`;

export const directoryCloseIcon = theme => css`
    ${musicIconBase(theme)}
    & > g > path:first-of-type {
        fill: ${theme.color.primary};
    }
    & > g > path:last-of-type {
        fill: ${theme.highlight.primary};
    }
`;

export const directoryOpenIcon = theme => css`
    ${musicIconBase(theme)}
`;
