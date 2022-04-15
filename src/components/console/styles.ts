import { css, SerializedStyles, Theme } from "@emotion/react";
import { _scrollbars } from "@styles/_common";
// import { css as classCss } from "emotion";

export const ConsoleContainer = (theme: Theme): SerializedStyles => css`
    height: calc(100% - 42px);
    width: 100%;
    top: 0;
    bottom: 0;
    left: 0;
    position: absolute;
    white-space: break-spaces;
    font-family: ${theme.font.monospace};
    color: ${theme.console};
    padding: 0 6px;
    padding-top: 6px;
    outline: none;
    overflow-x: hidden;
    overflow-y: scroll;
    ${_scrollbars(theme)}
    code {
        height: 100%;
        width: 100%;
        position: relative;
    }
`;
