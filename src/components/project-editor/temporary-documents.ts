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
                : Math.min(Math.max(panel.tabIndex, 0), tabs.length - 1)
    };
}

/** Use at both storage boundaries so temporary text cannot survive a reload. */
export function persistentWorkspace(
    layout: IPersistedWorkspaceLayout
): IPersistedWorkspaceLayout {
    const panels: IWorkspacePanelNode[] = [];
    const prune = (node: IWorkspaceLayoutNode): IWorkspaceLayoutNode | null => {
        if (node.kind === "panel") {
            const panel = persistentPanel(node);
            panels.push(panel);
            return panel.tabs.length > 0 ? panel : null;
        }
        const first = prune(node.first);
        const second = prune(node.second);
        if (!first) return second;
        if (!second) return first;
        return { ...node, first, second };
    };
    // Keep one empty pane when the whole workspace contained temporary tabs.
    const root = prune(layout.root) ?? panels[0];
    const retainedPanels = panels.filter(
        (panel) => panel.tabs.length > 0 || panel === root
    );
    const hasPanel = (id: string | null | undefined) =>
        retainedPanels.some((panel) => panel.id === id);
    const sidebar = (panel: IWorkspacePanelNode | null) => {
        const saved = panel && persistentPanel(panel);
        return saved?.tabs.length ? saved : null;
    };
    return {
        activePanelId: hasPanel(layout.activePanelId)
            ? layout.activePanelId
            : retainedPanels[0].id,
        maximizedPanelId: hasPanel(layout.maximizedPanelId)
            ? layout.maximizedPanelId
            : null,
        nextPanelNumber: layout.nextPanelNumber,
        nextSplitNumber: layout.nextSplitNumber,
        nextTabNumber: layout.nextTabNumber,
        root,
        leftSidebar: sidebar(layout.leftSidebar),
        rightSidebar: sidebar(layout.rightSidebar),
        bottomSidebar: sidebar(layout.bottomSidebar)
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
