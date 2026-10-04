import { css, SerializedStyles, Theme } from "@emotion/react";
import { rgba } from "@styles/utils";

export const container = (theme: Theme): SerializedStyles => css`
    width: 100%;
    height: 100%;
    background-color: ${theme.fileTreeBackground};
    color: ${theme.textColor} !important;
    font-size: 13px;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
`;

export const headerBar = (theme: Theme): SerializedStyles => css`
    flex: 0 0 36px;
    height: 36px;
    display: flex;
    align-items: center;
    position: relative;
    background-color: ${theme.highlightBackgroundAlt};
    color: ${theme.lineNumber};
    box-shadow: inset 0 -1px 0 ${theme.line};

    p {
        margin: 0;
        margin-left: 12px;
        margin-right: 64px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
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
    z-index: 0;
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
    z-index: 0;
    border-radius: 50%;
    background-clip: content-box;
    &:hover {
        background-color: ${theme.buttonBackgroundHover}!important;
        color: ${theme.buttonTextColorHover}!important;
    }
`;

export const delEditContainer = css`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 2px;
    flex: 0 0 auto;
    min-width: 44px;

    &:empty {
        display: none;
    }
`;

export const nonCloudActionsContainer = css`
    display: flex;
    align-items: center;
    gap: 6px;
`;

export const nonCloudActionIcon = (theme: Theme): SerializedStyles => css`
    cursor: pointer;
    color: ${theme.textColor};
    width: 22px;
    height: 22px;
    z-index: 0;
    padding: 3px;
    border-radius: 6px;
    border: 1px solid ${theme.line};
    background-color: ${theme.buttonBackground};
    transition:
        background-color 0.15s ease,
        color 0.15s ease,
        border-color 0.15s ease;

    &:hover {
        background-color: ${theme.highlightBackground};
        color: ${theme.textColor};
        border-color: ${theme.lineHover};
    }
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
    margin-top: 0;
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
`;

export const listItem = css`
    /* Override the app-wide MUI list padding, including its !important rule. */
    && {
        padding: 0 12px 0 var(--file-tree-indent, 6px) !important;
    }
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    box-sizing: border-box;
    min-height: 36px;
    overflow: hidden;
`;

export const draggingOver = (theme: Theme): SerializedStyles => css`
    ${listItem}
    & .MuiTouchRipple-root {
        background-color: rgba(${rgba(theme.allowed, 0.1)}) !important;
    }
`;

// Keep every glyph centered in the same slot, including taller transient rows.
export const listItemIcon = (theme: Theme): SerializedStyles => css`
    flex: 0 0 36px;
    min-width: 36px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${theme.textColor};

    > svg {
        display: block;
        width: 36px;
        height: 36px;
    }

    > svg.MuiSvgIcon-root {
        width: 28px;
        height: 28px;
    }
`;

export const filenameStyle = (theme: Theme): SerializedStyles => css`
    font-family: ${theme.font.regular};
    font-size: 13px;
    font-weight: 400;
    color: ${theme.textColor};
    padding: 0;
    margin: 0;
    margin-left: 10px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    flex: 1;
    min-width: 0;
    max-width: calc(100% - 20px);
`;
