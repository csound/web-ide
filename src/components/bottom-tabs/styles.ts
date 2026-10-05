import { css, SerializedStyles, Theme } from "@emotion/react";

export const mobileLayout = css`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
`;

export const mobileContent = css`
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
    position: relative;
`;

export const mobileEditor = css`
    height: 100%;
    min-height: 0;
    overflow: hidden;

    .cm-editor {
        height: 100%;
    }

    .cm-scroller {
        overflow: auto;
    }
`;

export const mobileConsole = (): SerializedStyles => css`
    height: 100%;
    min-height: 0;
    position: relative;
`;

export const mobileManual = (): SerializedStyles => css`
    height: 100%;
    min-height: 0;
    position: relative;
    & > div {
        padding: 0 !important;
        height: 100% !important;
        min-height: 0;
    }
`;

export const mobileFileTree = (): SerializedStyles => css`
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow: auto;
    .MuiListItem-root {
        min-height: 44px;
    }
    .MuiList-root {
        padding-bottom: 12px;
    }
    & > div {
        padding: 0 !important;
        margin-top: 0 !important;
    }
    #web-ide-file-tree-header {
        display: none;
    }
`;

export const heightFix = css`
    height: 100%;
    min-height: 0;
    & > div {
        height: 100%;
        min-height: 0;
    }
    & > div > div:nth-of-type(2) {
        height: auto;
        min-height: 0;
    }
`;

export const mobileDocumentBar = (theme: Theme): SerializedStyles => css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex: 0 0 auto;
    min-height: 40px;
    padding: 2px 8px 2px 12px;
    border-bottom: 1px solid ${theme.line};
    color: ${theme.altTextColor};
    background: ${theme.background};
    font-size: 12px;
    > span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .MuiToggleButtonGroup-root .MuiToggleButton-root {
        min-height: 36px;
    }
`;
