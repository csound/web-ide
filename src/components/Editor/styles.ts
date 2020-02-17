import { css } from "@emotion/core";

export const root = css`
    font-size: 16px;
    width: 100%;
    height: 100%;
    & > div {
        width: 100%;
        height: auto;
        min-height: 100%;
        position: absolute;
    }

    & .CodeMirror-fullscreen {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        height: auto;
        z-index: 9;
    }

    & .CodeMirror-vscrollbar {
        overflow: hidden !important;
    }

    & .CodeMirror-scroll {
        overflow: visible !important;
        margin: 0 !important;
        padding: 0 !important;
        height: auto !important;
        min-height: 100%;
        width: 100%;
        position: static !important;
    }

    & .CodeMirror-sizer > div {
        left: 3px;
    }
`;
