import type {
    IPersistedWorkspaceLayout,
    IWorkspaceLayoutNode,
    IWorkspacePanelNode
} from "./types";

/** A buffer belongs to its open tabs, never to the project's saved files. */
export interface TemporaryDocument {
    filename: string;
    value: string;
    source?: {
        kind: "manual-example";
        url: string;
        assets: string[];
    };
}

export const OPEN_TEMPORARY_DOCUMENT = "PROJECT_EDITOR.OPEN_TEMPORARY_DOCUMENT";
export const UPDATE_TEMPORARY_DOCUMENT =
    "PROJECT_EDITOR.UPDATE_TEMPORARY_DOCUMENT";

export const openTemporaryDocument = (document: TemporaryDocument) => ({
    type: OPEN_TEMPORARY_DOCUMENT,
    documentUid: `temporary-${crypto.randomUUID()}`,
    document
});

export const updateTemporaryDocument = (
    documentUid: string,
    value: string
) => ({
    type: UPDATE_TEMPORARY_DOCUMENT,
    documentUid,
    value
});

export function mapWorkspacePanels(
    node: IWorkspaceLayoutNode,
    update: (panel: IWorkspacePanelNode) => IWorkspacePanelNode
): IWorkspaceLayoutNode {
    return node.kind === "panel"
        ? update(node)
        : {
              ...node,
              first: mapWorkspacePanels(node.first, update),
              second: mapWorkspacePanels(node.second, update)
          };
}

function persistentPanel(panel: IWorkspacePanelNode): IWorkspacePanelNode {
    const active = panel.tabs[panel.tabIndex];
    const tabs = panel.tabs.filter((tab) => !tab.temporary);
    const activeIndex = tabs.findIndex((tab) => tab.id === active?.id);
    return {
        ...panel,
        tabs,
        tabIndex:
            activeIndex >= 0
                ? activeIndex
                : Math.min(panel.tabIndex, tabs.length - 1)
    };
}

/** Use at both storage boundaries so temporary text cannot survive a reload. */
export function persistentWorkspace(
    layout: IPersistedWorkspaceLayout
): IPersistedWorkspaceLayout {
    return {
        activePanelId: layout.activePanelId,
        maximizedPanelId: layout.maximizedPanelId,
        nextPanelNumber: layout.nextPanelNumber,
        nextSplitNumber: layout.nextSplitNumber,
        nextTabNumber: layout.nextTabNumber,
        root: mapWorkspacePanels(layout.root, persistentPanel),
        leftSidebar: layout.leftSidebar && persistentPanel(layout.leftSidebar),
        rightSidebar:
            layout.rightSidebar && persistentPanel(layout.rightSidebar),
        bottomSidebar:
            layout.bottomSidebar && persistentPanel(layout.bottomSidebar)
    };
}

export function temporaryDocumentUids(node: IWorkspaceLayoutNode): string[] {
    return node.kind === "panel"
        ? node.tabs.filter((tab) => tab.temporary).map((tab) => tab.uid)
        : [
              ...temporaryDocumentUids(node.first),
              ...temporaryDocumentUids(node.second)
          ];
}
