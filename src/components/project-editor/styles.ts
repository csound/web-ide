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

    .ProjectEditorResizer {
        flex: 0 0 auto;
        position: relative;
        z-index: 5;
        background-color: ${theme.line};
        transition: background-color 0.15s ease;
    }

    .ProjectEditorResizer.vertical {
        width: 1px;
        cursor: col-resize;
    }

    .ProjectEditorResizer.horizontal {
        height: 1px;
        cursor: row-resize;
    }

    .ProjectEditorResizer:focus-visible,
    .ProjectEditorResizer:hover,
    .ProjectEditorResizer[data-resize-handle-active="pointer"],
    .ProjectEditorResizer[data-resize-handle-state="drag"] {
        background-color: ${theme.tabHighlightActive};
    }
`;

export const workbenchShell = css`
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) 44px;
    grid-template-rows: minmax(0, 1fr) 34px;
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
    padding: 0 8px 0 0;
    min-width: 0;
    overflow: hidden;
    box-sizing: border-box;
    background: ${theme.headerBackground};
    border-top: 1px solid ${theme.line};
`;

export const bottomRailActions = css`
    display: flex;
    flex: 1 1 auto;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
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
        background: ${active ? theme.highlightBackgroundAlt : "transparent"};
        color: ${active ? theme.textColor : theme.altTextColor};
        cursor: pointer;
        transition:
            background-color 0.15s ease,
            color 0.15s ease;
        flex: 0 0 auto;
        position: relative;

        &::before {
            content: "";
            position: absolute;
            ${
                compact
                    ? "left: 0; top: 4px; bottom: 4px; width: 2px;"
                    : "left: 8px; right: 8px; top: 0; height: 2px;"
            }
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
    border: 0;
    background: ${theme.background};
    box-shadow: ${
        isActive ? `inset 0 1px 0 ${theme.tabHighlightActive}` : "none"
    };
`;

export const panelTopBar = (theme: Theme): SerializedStyles => css`
    flex: 0 0 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 0;
    background: ${theme.headerBackground};
    border-bottom: 1px solid ${theme.line};
    color: ${theme.headerTextColor};
    box-sizing: border-box;
    overflow: hidden;
`;

export const panelTopBarTitle = (theme: Theme): SerializedStyles => css`
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.4;
    color: ${theme.headerTextColor};
    padding-left: 12px;
`;

export const panelHeaderTabs = css`
    flex: 1 1 auto;
    min-width: 0;
    height: 100%;
    display: flex;
    align-items: stretch;
    overflow: hidden;
`;

export const panelActionGroup = css`
    padding-right: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    gap: 4px;
    flex: 0 1 auto;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: thin;
`;

export const sectionHeaderActions = css`
    ${panelActionGroup};
    flex-shrink: 0;
    overflow: visible;
`;

export const panelActionButton = (theme: Theme): SerializedStyles => css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    flex: 0 0 28px;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: ${theme.altTextColor};
    padding: 0;
    cursor: pointer;
    transition:
        background-color 0.15s ease,
        color 0.15s ease;

    svg {
        font-size: 16px;
    }

    &:hover {
        background: ${theme.highlightBackground};
        color: ${theme.textColor};
    }

    &:focus-visible {
        outline: 2px solid ${theme.textColor};
        outline-offset: -2px;
    }
`;

export const panelBody = css`
    flex: 1 1 auto;
    min-height: 0;
    min-width: 0;
    width: 100%;
    overflow: hidden;
`;

export const closeButton = css`
    top: 50%;
    right: 4px;
    width: 20px;
    height: 20px;
    padding: 2px;
    position: absolute;
    z-index: 10;
    transform: translateY(-50%);
    span {
        pointer-events: none;
    }
    svg {
        font-size: 15px;
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

export const mobileNavContainer = (theme: Theme): SerializedStyles => css`
    background-color: ${theme.headerBackground};
    position: relative;
    flex: 0 0 auto;
    width: 100%;
    min-height: 56px;
    padding: 0 env(safe-area-inset-right) env(safe-area-inset-bottom)
        env(safe-area-inset-left);
    box-sizing: border-box;
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
        border-top: 2px solid
            ${isActive ? theme.headerTextColor : "transparent"};
        background: transparent;
        color: ${theme.headerTextColor};
        font-weight: ${isActive ? 600 : 400};
        cursor: pointer;
        font-size: 11px;
        min-height: 55px;
        min-width: 0;
        padding: 6px 2px;

        &:focus-visible {
            outline: 2px solid ${theme.headerTextColor};
            outline-offset: -4px;
        }

        &:hover {
            opacity: 1;
            background: ${theme.buttonBackgroundHover};
        }

        svg {
            font-size: 20px;
        }
    `;
