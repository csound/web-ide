import { css } from "@emotion/core";

export const root = css`
    font-size: 16px;
    width: 100%;
    height: 100%;
    & > div {
        min-height: 100%;
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

    & .CodeMirror-sizer > div {
        left: 3px;
    }
`;
