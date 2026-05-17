import { css, SerializedStyles, Theme } from "@emotion/react";
import { shadow } from "@styles/_common";

export const splitterRoot = (theme: Theme): SerializedStyles => css`
    position: relative;
    width: 100%;
    height: 100%;
    background: ${theme.gutterBackground};
    box-sizing: border-box;
    min-height: 0;
    overflow: hidden;

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

    .Resizer {
        flex: 0 0 auto;
        position: relative;
        z-index: 5;
        background-color: rgba(255, 255, 255, 0.04);
        transition: background-color 0.15s ease;
    }

    .Resizer.vertical {
        width: 6px;
        cursor: col-resize;
    }

    .Resizer.horizontal {
        height: 6px;
        cursor: row-resize;
    }

    .Resizer:hover,
    .Resizer[data-resize-handle-active="pointer"],
    .Resizer[data-resize-handle-state="drag"] {
        background-color: rgba(255, 255, 255, 0.14);
    }
`;

export const workbenchShell = css`
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) 44px;
    grid-template-rows: minmax(0, 1fr) 40px;
    width: 100%;
    height: 100%;
    min-height: 0;
`;

export const edgeRail =
    (side: "left" | "right") =>
    (theme: Theme): SerializedStyles => css`
        grid-column: ${side === "left" ? "1" : "3"};
        grid-row: 1 / 3;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 8px 0;
        box-sizing: border-box;
        background: ${theme.headerBackground};
        border-${side === "left" ? "right" : "left"}: 1px solid
            ${theme.line};
    `;

export const workspaceCanvas = css`
    grid-column: 2;
    grid-row: 1;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
`;

export const paneFrame = css`
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

export const bottomRail = (theme: Theme): SerializedStyles => css`
    grid-column: 2;
    grid-row: 2;
    display: flex;
    align-items: center;
    gap: 0;
    padding: 0 10px;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    box-sizing: border-box;
    background: ${theme.headerBackground};
    border-top: 1px solid ${theme.line};
`;

export const activityButton =
    ({ active, compact }: { active: boolean; compact: boolean }) =>
    (theme: Theme): SerializedStyles => css`
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: ${compact ? "32px" : "auto"};
        min-width: ${compact ? "32px" : "unset"};
        height: 32px;
        padding: ${compact ? "0" : "0 10px"};
        border: 0;
        border-radius: ${compact ? "0" : "6px 6px 0 0"};
        background: ${active
            ? `${theme.highlightBackgroundAlt}CC`
            : "transparent"};
        color: ${active ? theme.textColor : theme.unfocusedTextColor};
        cursor: pointer;
        transition:
            background-color 0.15s ease,
            color 0.15s ease;
        flex: 0 0 auto;
        position: relative;

        &::before {
            content: "";
            position: absolute;
            ${compact
                ? "left: 0; top: 4px; bottom: 4px; width: 2px;"
                : "left: 8px; right: 8px; top: 0; height: 2px;"}
            background: ${active ? theme.tabHighlightActive : "transparent"};
            border-radius: 999px;
        }

        &:hover {
            background: ${theme.highlightBackground};
            color: ${theme.textColor};
        }

        svg {
            font-size: 18px;
        }

        span {
            display: ${compact ? "none" : "inline"};
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
        }
    `;

export const panelShell = (isActive: boolean) => (theme: Theme) => css`
    height: 100%;
    width: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    border: 1px solid ${isActive ? theme.tabHighlightActive : `${theme.line}77`};
    background: linear-gradient(
        180deg,
        ${theme.background} 0%,
        ${theme.gutterBackground} 100%
    );
    box-shadow: ${isActive
        ? `inset 0 0 0 1px ${theme.tabHighlightActive}44`
        : "inset 0 0 0 1px rgba(0,0,0,0.08)"};
`;

export const panelTopBar = (theme: Theme): SerializedStyles => css`
    flex: 0 0 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 0 10px 0 12px;
    background: ${theme.headerBackground};
    border-bottom: 1px solid ${theme.line};
    color: ${theme.headerTextColor};
    box-sizing: border-box;
`;

export const panelTopBarTitle = (theme: Theme): SerializedStyles => css`
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${theme.unfocusedTextColor};
`;

export const panelActionGroup = css`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;
`;

export const panelActionButton = (theme: Theme): SerializedStyles => css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 6px;
    background: ${theme.highlightBackgroundAlt};
    color: ${theme.lineNumber};
    padding: 0;
    cursor: pointer;
    transition:
        background-color 0.15s ease,
        color 0.15s ease,
        transform 0.15s ease;

    svg {
        font-size: 16px;
    }

    &:hover {
        background: ${theme.highlightBackground};
        color: ${theme.textColor};
        transform: translateY(-1px);
    }
`;

export const panelTabsBody = css`
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
    overflow: hidden;
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
    z-index: 9999;
    height: 56px;
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
