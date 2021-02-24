import { css, SerializedStyles, Theme } from "@emotion/react";
import { shadow, _scrollbars } from "@styles/_common";

export const content = (theme: Theme): SerializedStyles => css`
    position: absolute;
    outline: none;
    & > div {
        max-height: 80vh;
        overflow-y: scroll;
        color: ${theme.textColor};
        position: relative;
        border: 2px solid ${theme.line};
        border-radius: 6px;
        background-color: ${theme.background};
        ${shadow}
        box-sizing: content-box;
        padding: 16px 32px 24px;
        ${_scrollbars(theme)}
    }
`;
