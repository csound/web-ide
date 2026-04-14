import { css, SerializedStyles, Theme } from "@emotion/react";
import { shadow } from "@styles/_common";
import { headerHeight, mobileNavHeight } from "@styles/constants";

export const splitterRoot = css`
    position: relative;
    width: 100vw;
    height: 100vh;
    top: 0;
    padding-top: ${headerHeight}px;
    left: 0;
    box-sizing: border-box;
    [data-panel-group] {
        height: 100%;
        width: 100%;
    }
    [data-panel] {
        min-width: 0;
        min-height: 0;
        display: flex;
        flex-direction: column;
    }
    [data-panel] > div,
    [data-panel] > main,
    [data-panel] > section {
        height: 100%;
        width: 100%;
    }
`;

export const closeButton = css`
    top: 4px;
    right: 8px;
    padding: 6px;
    position: absolute;
    z-index: 10;
    span {
        pointer-events: none;
    }
`;

export const manualWindowRoot = css`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
`;

export const manualWindowHeader = css`
    position: relative;
    flex: 0 0 36px;
`;

export const manualWindowFrame = css`
    flex: 1 1 auto;
    min-height: 0;

    iframe {
        display: block;
        width: 100%;
        height: 100%;
        border: 0;
    }
`;

export const headIconsContainer = (theme: Theme): SerializedStyles => css`
    position: absolute;
    right: 16px;

    svg {
        font-size: 18px;
        color: ${theme.lineNumber}!important;
    }
    height: 36px;
    & span {
        cursor: pointer;
        &:hover {
            svg {
                fill: ${theme.textColor}!important;
            }
        }
    }
`;

export const mobileNavigationContainer = (
    theme: Theme
): SerializedStyles => css`
    background-color: ${theme.headerBackground};
    position: relative;
    width: 100%;
    z-index: 2;
    min-height: 56px;
    padding-bottom: env(safe-area-inset-bottom);
    box-sizing: border-box;
    ${shadow};
    border-top: 1px solid;
`;

export const mobileNavigationButton = (theme: Theme): SerializedStyles => css`
    color: ${theme.headerTextColor};
`;

// ── New custom mobile bottom navigation ──────────────────────────────────────

export const mobileNavContainer = (theme: Theme): SerializedStyles => css`
    background-color: ${theme.headerBackground};
    position: fixed;
    width: 100%;
    bottom: 0;
    z-index: 50;
    height: ${mobileNavHeight}px;
    display: flex;
    align-items: stretch;
    ${shadow};
    border-top: 1px solid ${theme.line};
`;

export const mobileNavTabGroup = css`
    display: flex;
    align-items: stretch;
    flex: 1;
`;

export const mobileNavTabButton =
    (isActive: boolean) =>
    (theme: Theme): SerializedStyles => css`
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        flex: 1;
        border: 0;
        border-left: 1px solid ${theme.line};
        border-top: 2px solid
            ${isActive ? theme.headerTextColor : "transparent"};
        background: transparent;
        color: ${theme.headerTextColor};
        opacity: ${isActive ? 1 : 0.6};
        cursor: pointer;
        font-size: 10px;
        padding: 4px 2px;
        transition: opacity 0.15s;

        &:hover {
            opacity: 1;
            background: ${theme.buttonBackgroundHover};
        }

        svg {
            font-size: 20px;
        }
    `;
