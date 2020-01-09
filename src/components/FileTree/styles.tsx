import { css } from "@emotion/core";

export const container = theme => css`
    width: 100%;
    height: 100%;
    background-color: ${theme.fileTreeBackground.primary};
    color: ${theme.color.primary} !important;
    padding: 0 !important;
    margin-top: 3px;
    border-radius: 0px !important;
    button {
        width: 100%;
    }
    & p {
        color: ${theme.color.primary} !important;
    }
    & > .MuiList-root {
        padding: 0 !important;
    }
    & > .MuiList-root > .MuiButtonBase-root {
        display: none;
        transition: none !important;
        pointer-events: none !important;
        left: 12px;
    }

    & div.MuiButtonBase-root {
        padding-right: 0px;
        width: 150px;
    }

    .MuiButtonBase-root button {
        margin: 0;
        color: rgb(222, 222, 222) !important;
        top: 0px;
        width: 24px;
        left: 170px;
        top: -2px;
    }

    .MuiButtonBase-root button:first-of-type {
        left: 142px;
    }

    .MuiListItem-button {
        background-color: ${theme.fileTreeBackground.primary};
    }

    .MuiListItemText-root {
        width: 100%;
        padding: 0 !important;
        position: relative;
    }

    .MuiIconButton-root {
        position: absolute;
        right: 24px;
    }

    .MuiListItemIcon-root {
        display: none;
    }

    .MuiListItemText-root {
        width: 90%;
    }

    .MuiButtonBase-root .MuiButton-label {
        position: absolute;
        right: 4px;
    }
`;

export const fileTreeNode = css`
    position: relative;
    display: flex;
    align-content: center;
`;

export const fileTreeNodeText = css`
    color: rgb(222, 222, 222);
    text-overflow: ellipsis;
    overflow: hidden;
    font-size: 0.875rem;
    font-family: "Roboto", "Helvetica", "Arial", sans-serif;
    font-weight: 400;
    line-height: 1.43;
    letter-spacing: 0.01071em;
    margin 0;
    margin-left: 6px;
    padding: 0;
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

export const editIcon = css`
    margin-top: 5px;
    zoom: 80%;
`;

export const deleteIcon = css`
    zoom: 106%;
    margin-top: 1px;
    color: rgb(222, 222, 222) !important;
`;

export const invisibleClickableArea = css`
    // background-color: blue !important;
    position: absolute;
    top: 0px;
    left: 0;
    width: calc(100% - 66px);
    height: 100%;
    z-index: 2;
`;

export const invisibleUnClickableArea = css`
    cursor: initial !important;
    position: absolute;
    top: -1px;
    left: 0;
    width: calc(100% - 2px);
    height: 100%;
    z-index: 2;
`;
