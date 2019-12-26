import { css } from "@emotion/core";

export const splitterLayoutContainer = css`
    & > div {
        height: calc(100% - 64px);
        bottom: 0;
        overflow: hidden;
    }
`;

export const tabDock = css`
    height: 100%;
    display: flex;
    flex-flow: cloumn;
`;
