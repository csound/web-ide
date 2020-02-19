import { css } from "@emotion/core";
import { isMobile } from "@root/utils";

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
        ${!isMobile() ? "overflow: hidden !important;" : ""}
    }

    & .CodeMirror-scroll {
        ${!isMobile() ? "overflow: visible !important;" : ""}
        ${!isMobile()
            ? "min-height: 100%;"
            : "min-height: calc(100vh - 160px); max-height: calc(100vh - 160px);"}
        margin: 0 !important;
        padding: 0 !important;
        height: auto !important;
        width: 100%;
        position: static !important;
    }

    & .CodeMirror-sizer > div {
        left: 3px;
    }
`;
