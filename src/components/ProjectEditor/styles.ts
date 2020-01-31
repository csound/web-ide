import { css } from "@emotion/core";

export const splitterLayoutContainer = css`
    width: 100%;
    height: calc(100% - 64px);
    position absolute;
    bottom: 0;
  overflow: hidden;
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

export const headIconsContainer = theme => css`
    position: absolute;
    right: 16px;

    svg {
        font-size: 16px;
    }
    height: 20px;
    & span {
        cursor: pointer;
        &:hover {
            svg {
                color: ${theme.color.primary}!important;
            }
        }
    }
`;
