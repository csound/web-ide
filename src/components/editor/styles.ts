import { css, SerializedStyles, Theme } from "@emotion/react";
import { _scrollbars } from "@root/styles/_common";

export const root = (theme: Theme): SerializedStyles => css`
    position: relative;
    font-size: 16px;
    width: 100%;
    height: 100%;
    & > div {
        position: absolute;
        height: 100%;
        width: 100%;
    }

    & .CodeMirror-fullscreen {
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
    .CodeMirror-scroll,
    .CodeMirror-vscrollbar,
    .CodeMirror-hscrollbar {
        ${_scrollbars(theme)}
    }
`;
