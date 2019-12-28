import { css } from "@emotion/core";

export const splitterLayoutContainer = css`
    & > div {
        height: 100%;
        bottom: 0;
        overflow: hidden;
    }
`;

export const tabDock = css`
    height: 100%;
    display: flex;
    flex-flow: cloumn;
`;
