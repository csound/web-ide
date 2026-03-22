import { css, SerializedStyles, Theme } from "@emotion/react";
import { shadow, _scrollbars } from "@styles/_common";

export const content = (theme: Theme): SerializedStyles => css`
    position: absolute;
    outline: none;
    max-width: calc(100vw - 6px);
    max-height: calc(100vh - 6px);
    & > div {
        max-height: calc(100vh - 6px);
        overflow-y: auto;
        overflow-x: hidden;
        color: ${theme.textColor};
        position: relative;
        border: 0;
        border-radius: 8px;
        background-color: ${theme.background};
        ${shadow}
        box-sizing: border-box;
        padding: 20px 28px 24px;
        -webkit-overflow-scrolling: touch;
        ${_scrollbars(theme)}
    }

    @media (max-width: 760px) {
        max-width: calc(100vw - 4px);
        max-height: calc(100vh - 4px);

        & > div {
            max-height: calc(100vh - 4px);
            border-radius: 12px;
            padding: 18px 16px 20px;
        }
    }
`;
