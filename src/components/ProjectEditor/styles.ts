import { css } from "@emotion/core";

export const splitterLayoutContainer = css`
    .layout-pane {
        overflow: hidden;
    }

    .layout-pane-primary > div {
        height: 100%;
    }

    & > div {
        height: 100%;
        bottom: 0;
        overflow: hidden;
    }
`;

export const closeButton = css`
    top: 10px;
    right: 8px;
    padding: 6px;
    position: absolute;
    z-index: 1001;
`;
