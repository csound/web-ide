import { css, SerializedStyles } from "@emotion/react";
import { headerHeight } from "@styles/constants";

export const mobileLayout = css`
    width: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
    margin-top: ${headerHeight}px;
    height: calc(100vh - ${headerHeight}px);
    height: calc(100dvh - ${headerHeight}px);
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
        zoom: 120%;
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
    zoom: 120%;
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
