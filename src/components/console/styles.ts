import { css, SerializedStyles, Theme } from "@emotion/react";
import { _scrollbars } from "@styles/_common";
// import { css as classCss } from "emotion";

export const ConsoleContainer = (theme: Theme): SerializedStyles => css`
    height: 100%;
    width: 100%;
    min-height: 0;
    min-width: 0;
    position: relative;
    display: flex;
    flex-direction: column;
    white-space: break-spaces;
    font-family: ${theme.font.monospace};
    font-size: 13px;
    line-height: 1.6;
    box-sizing: border-box;
    color: ${theme.console};
    background: ${theme.background};
    padding: 8px 12px;
    outline: none;
    overflow-x: hidden;
    overflow-y: auto;
    ${_scrollbars(theme)}
    code {
        display: block;
        flex: 1 1 auto;
        min-height: 100%;
        width: 100%;
        position: relative;
    }
`;
