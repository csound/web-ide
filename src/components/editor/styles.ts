import { css, SerializedStyles, Theme } from "@emotion/react";
import { _scrollbars } from "@root/styles/_common";

export const root = (theme: Theme): SerializedStyles => css`
    height: auto;
    width: 100%;
    overflow: auto;
    flex: auto;

    .CodeMirror-scroll,
    .CodeMirror-vscrollbar,
    .CodeMirror-hscrollbar {
        ${_scrollbars(theme)}
    }
`;
