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

export const tabPanelController = theme => css`
    position: absolute;
    right: 8px;
    top: 5px;
    & button {
        margin-left: 8px;
    }
    & svg {
        color: #373a47;
    }

    & svg:hover {
        color: #f8f8f2;
    }
`;

export const tabDock = theme => css`
    height: 100%;
    display: flex;
    flex-direction: column;
    flex-wrap: initial;
    color: ${theme.color.primary};

    & > ul {
        background-color: ${theme.highlight.primary};
    }

    & > ul > li {
        box-sizing: content-box;
        border-bottom: 1px solid ${theme.highlight.primary};
    }

    & > ul > li:hover {
        background-color: ${theme.highlightAlt.primary};
        border-radius: 5px 5px 0 0;
    }

    & .tab-panel-controller {
        position: absolute;
        right: 8px;
        top: 5px;
    }

    & .tab-panel-controller button {
        margin-left: 8px;
    }
    & .tab-panel-controller svg {
        color: #373a47;
    }

    & .tab-panel-controller svg:hover {
        color: #f8f8f2;
    }
`;
