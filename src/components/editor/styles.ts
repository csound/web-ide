import { css, SerializedStyles, Theme } from "@emotion/react";
import { _scrollbars } from "@root/styles/_common";

export const root = (theme: Theme): SerializedStyles => css`
    height: 100%;
    width: 100%;
    overflow-y: scroll;
    flex: auto;
    ${_scrollbars(theme)}
`;
