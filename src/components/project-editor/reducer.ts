import {
    CLOSE_PANEL,
    CLOSE_SIDEBAR_TAB,
    IPersistedWorkspaceLayout,
    MANUAL_LOOKUP_STRING,
    OPEN_SIDEBAR_TAB,
    PANEL_CLOSE_TAB,
    MOVE_PANEL,
    PANEL_REORDER_TABS,
    PANEL_SWITCH_TAB,
    SET_ACTIVE_PANEL,
    SET_FILE_TREE_PANEL_OPEN,
    SET_MANUAL_PANEL_OPEN,
    SET_SIDEBAR_TAB_INDEX,
    SPLIT_ACTIVE_PANEL,
    TAB_CLOSE,
    TAB_DOCK_CLOSE,
    TAB_DOCK_INIT,
    TAB_DOCK_OPEN_NON_CLOUD_FILE,
    TAB_DOCK_OPEN_TAB_BY_DOCUMENT_UID,
    TAB_DOCK_REARRANGE_TABS,
    TAB_DOCK_SWITCH_TAB,
    TOGGLE_MAXIMIZE_PANEL,
    TOGGLE_MANUAL_PANEL,
    IOpenDocument,
    ITabDock,
    IWorkspaceLayoutNode,
    IWorkspacePanelNode,
    IWorkspaceTab,
    SidebarPosition,
    WorkspaceTabType
} from "./types";
import { nonCloudFiles } from "../file-tree/actions";

export interface IProjectEditorReducer {
    root: IWorkspaceLayoutNode;
    activePanelId: string;
    maximizedPanelId: string | null;
    leftSidebar: IWorkspacePanelNode | null;
    rightSidebar: IWorkspacePanelNode | null;
    bottomSidebar: IWorkspacePanelNode | null;
    tabDock: ITabDock;
    fileTreeVisible: boolean;
    manualVisible: boolean;
    manualLookupString: string;
    nextPanelNumber: number;
    nextSplitNumber: number;
    nextTabNumber: number;
}

const createPanel = (
    id: string,
    tabs: IWorkspaceTab[] = [],
    tabIndex = tabs.length > 0 ? 0 : -1
): IWorkspacePanelNode => ({
    id,
    kind: "panel",
    tabs,
    tabIndex
});

const createUtilityTab = (
    id: string,
    type: Exclude<WorkspaceTabType, "editor">
): IWorkspaceTab => ({
    id,
    type,
    uid: type,
    editorInstance: undefined
});

const createEditorTab = (
    id: string,
    openDocument: IOpenDocument
): IWorkspaceTab => ({
    ...openDocument,
    id,
    type: "editor"
});

const initialLayoutState = (): IProjectEditorReducer => ({
    root: createPanel("panel-1"),
    activePanelId: "panel-1",
    maximizedPanelId: null,
    leftSidebar: createPanel("sidebar-left", [
        createUtilityTab("sidebar-left-fileTree", "fileTree")
    ]),
    rightSidebar: null,
    bottomSidebar: null,
    tabDock: {
        tabIndex: -1,
        openDocuments: []
    },
    fileTreeVisible: true,
    manualVisible: false,
    manualLookupString: "",
    nextPanelNumber: 2,
    nextSplitNumber: 1,
    nextTabNumber: 1
});

const storeTabDockState = (
    projectUid: string,
    openDocuments: IOpenDocument[],
    tabIndex: number | undefined
): void => {
    try {
        const tabOrder: string[] = openDocuments.map((doc) => doc.uid);
        localStorage.setItem(
            `${projectUid}:tabOrder`,
            JSON.stringify(tabOrder)
        );
        if (tabIndex !== undefined) {
            localStorage.setItem(`${projectUid}:tabIndex`, `${tabIndex}`);
        }
    } catch (error) {
        console.error(error);
    }
};

const findPanelById = (
    node: IWorkspaceLayoutNode,
    panelId: string
): IWorkspacePanelNode | undefined => {
    if (node.kind === "panel") {
        return node.id === panelId ? node : undefined;
    }

    return (
        findPanelById(node.first, panelId) ||
        findPanelById(node.second, panelId)
    );
};

const mapPanel = (
    node: IWorkspaceLayoutNode,
    panelId: string,
    updater: (panel: IWorkspacePanelNode) => IWorkspacePanelNode
): [IWorkspaceLayoutNode, boolean] => {
    if (node.kind === "panel") {
        return node.id === panelId ? [updater(node), true] : [node, false];
    }

    const [first, firstChanged] = mapPanel(node.first, panelId, updater);
    if (firstChanged) {
        return [{ ...node, first }, true];
    }

    const [second, secondChanged] = mapPanel(node.second, panelId, updater);
    return secondChanged ? [{ ...node, second }, true] : [node, false];
};

const containsPanel = (
    node: IWorkspaceLayoutNode,
    panelId: string
): boolean => {
    if (node.kind === "panel") {
        return node.id === panelId;
    }

    return (
        containsPanel(node.first, panelId) ||
        containsPanel(node.second, panelId)
    );
};

const findFirstPanelId = (node: IWorkspaceLayoutNode): string => {
    if (node.kind === "panel") {
        return node.id;
    }

    return findFirstPanelId(node.first);
};

const countPanels = (node: IWorkspaceLayoutNode): number => {
    if (node.kind === "panel") {
        return 1;
    }

    return countPanels(node.first) + countPanels(node.second);
};

const removePanel = (
    node: IWorkspaceLayoutNode,
    panelId: string
): [IWorkspaceLayoutNode, boolean] => {
    if (node.kind === "panel") {
        return [node, false];
    }

    if (node.first.kind === "panel" && node.first.id === panelId) {
        return [node.second, true];
    }

    if (node.second.kind === "panel" && node.second.id === panelId) {
        return [node.first, true];
    }

    if (containsPanel(node.first, panelId)) {
        const [first, removed] = removePanel(node.first, panelId);
        return removed ? [{ ...node, first }, true] : [node, false];
    }

    if (containsPanel(node.second, panelId)) {
        const [second, removed] = removePanel(node.second, panelId);
        return removed ? [{ ...node, second }, true] : [node, false];
    }

    return [node, false];
};

const splitPanel = (
    node: IWorkspaceLayoutNode,
    panelId: string,
    newPanel: IWorkspacePanelNode,
    side: "right" | "bottom",
    splitId: string
): [IWorkspaceLayoutNode, boolean] => {
    if (node.kind === "panel") {
        if (node.id !== panelId) {
            return [node, false];
        }

        return [
            {
                id: splitId,
                kind: "split",
                direction: side === "right" ? "vertical" : "horizontal",
                first: node,
                second: newPanel
            },
            true
        ];
    }

    const [first, firstChanged] = splitPanel(
        node.first,
        panelId,
        newPanel,
        side,
        splitId
    );
    if (firstChanged) {
        return [{ ...node, first }, true];
    }

    const [second, secondChanged] = splitPanel(
        node.second,
        panelId,
        newPanel,
        side,
        splitId
    );
    return secondChanged ? [{ ...node, second }, true] : [node, false];
};

const movePanelToRootEdge = (
    node: IWorkspaceLayoutNode,
    panelId: string,
    side: "left" | "right" | "bottom",
    splitId: string
): [IWorkspaceLayoutNode, boolean] => {
    const panel = findPanelById(node, panelId);
    if (!panel || countPanels(node) <= 1) {
        return [node, false];
    }

    const [remainingRoot, removed] = removePanel(node, panelId);
    if (!removed) {
        return [node, false];
    }

    return [
        {
            id: splitId,
            kind: "split",
            direction: side === "bottom" ? "horizontal" : "vertical",
            first: side === "left" ? panel : remainingRoot,
            second: side === "left" ? remainingRoot : panel
        },
        true
    ];
};

const reorderTabs = (
    panel: IWorkspacePanelNode,
    tabIds: string[],
    tabIndex: number
) => {
    const orderedTabs = tabIds
        .map((tabId) => panel.tabs.find((tab) => tab.id === tabId))
        .filter(Boolean) as IWorkspaceTab[];

    return {
        ...panel,
        tabs: orderedTabs,
        tabIndex: Math.min(tabIndex, orderedTabs.length - 1)
    };
};

const resolveNthEditorTabIndex = (
    panel: IWorkspacePanelNode,
    editorIndex: number
): number => {
    let seenEditors = -1;
    for (let index = 0; index < panel.tabs.length; index += 1) {
        if (panel.tabs[index].type === "editor") {
            seenEditors += 1;
            if (seenEditors === editorIndex) {
                return index;
            }
        }
    }

    return panel.tabIndex;
};

const deriveLegacyDock = (
    root: IWorkspaceLayoutNode,
    activePanelId: string
): ITabDock => {
    const panel =
        findPanelById(root, activePanelId) ||
        findPanelById(root, findFirstPanelId(root));
    if (!panel) {
        return { tabIndex: -1, openDocuments: [] };
    }

    const openDocuments = panel.tabs
        .filter((tab) => tab.type === "editor")
        .map((tab) => ({
            uid: tab.uid,
            isNonCloudDocument: tab.isNonCloudDocument,
            nonCloudFileAudioUrl: tab.nonCloudFileAudioUrl,
            nonCloudFileData: tab.nonCloudFileData,
            editorInstance: tab.editorInstance
        }));

    const activeTab = panel.tabs[panel.tabIndex];
    const tabIndex =
        activeTab?.type === "editor"
            ? openDocuments.findIndex((doc) => doc.uid === activeTab.uid)
            : -1;

    return {
        tabIndex,
        openDocuments
    };
};

const hasSidebarTab = (
    sidebar: IWorkspacePanelNode | null,
    type: WorkspaceTabType
): boolean => Boolean(sidebar?.tabs.some((tab) => tab.type === type));

const normalizeSidebarPanel = (
    sidebar: IWorkspacePanelNode | null
): IWorkspacePanelNode | null => {
    if (!sidebar || sidebar.tabs.length === 0) {
        return null;
    }

    const safeIndex = Math.min(sidebar.tabIndex, sidebar.tabs.length - 1);
    const activeTab = sidebar.tabs[Math.max(safeIndex, 0)];

    return {
        ...sidebar,
        tabs: activeTab ? [activeTab] : [],
        tabIndex: activeTab ? 0 : -1
    };
};

const syncLegacyState = (
    state: IProjectEditorReducer
): IProjectEditorReducer => {
    const leftSidebar = normalizeSidebarPanel(state.leftSidebar);
    const rightSidebar = normalizeSidebarPanel(state.rightSidebar);
    const bottomSidebar = normalizeSidebarPanel(state.bottomSidebar);

    return {
        ...state,
        leftSidebar,
        rightSidebar,
        bottomSidebar,
        tabDock: deriveLegacyDock(state.root, state.activePanelId),
        fileTreeVisible:
            hasSidebarTab(leftSidebar, "fileTree") ||
            hasSidebarTab(rightSidebar, "fileTree") ||
            hasSidebarTab(bottomSidebar, "fileTree"),
        manualVisible:
            hasSidebarTab(leftSidebar, "manual") ||
            hasSidebarTab(rightSidebar, "manual") ||
            hasSidebarTab(bottomSidebar, "manual")
    };
};

const getSidebarKey = (sidebar: SidebarPosition) => {
    if (sidebar === "left") return "leftSidebar" as const;
    if (sidebar === "right") return "rightSidebar" as const;
    return "bottomSidebar" as const;
};

const createSidebarPanel = (
    sidebar: SidebarPosition,
    tab: IWorkspaceTab
): IWorkspacePanelNode => createPanel(`sidebar-${sidebar}`, [tab], 0);

const ensureUtilityTab = (
    sidebar: IWorkspacePanelNode | null,
    tab: IWorkspaceTab
): IWorkspacePanelNode => {
    if (!sidebar) {
        return createSidebarPanel(
            tab.id.includes("sidebar-right")
                ? "right"
                : tab.id.includes("sidebar-bottom")
                  ? "bottom"
                  : "left",
            tab
        );
    }

    return {
        ...sidebar,
        tabs: [tab],
        tabIndex: 0
    };
};

const closePanelTabAndCollapse = (
    state: IProjectEditorReducer,
    panelId: string,
    tabId: string
): IProjectEditorReducer => {
    const panel = findPanelById(state.root, panelId);
    if (!panel) {
        return state;
    }

    const tabs = panel.tabs.filter((tab) => tab.id !== tabId);
    if (tabs.length === panel.tabs.length) {
        return state;
    }

    if (tabs.length === 0 && countPanels(state.root) > 1) {
        const [root, removed] = removePanel(state.root, panelId);
        if (!removed) {
            return state;
        }

        return syncLegacyState({
            ...state,
            root,
            maximizedPanelId:
                state.maximizedPanelId === panelId
                    ? null
                    : state.maximizedPanelId,
            activePanelId: containsPanel(root, state.activePanelId)
                ? state.activePanelId
                : findFirstPanelId(root)
        });
    }

    const [root] = mapPanel(state.root, panelId, (candidate) => ({
        ...candidate,
        tabs,
        tabIndex: Math.min(candidate.tabIndex, tabs.length - 1)
    }));

    return syncLegacyState({
        ...state,
        root,
        activePanelId: panelId
    });
};

const ProjectEditorReducer = (
    state: IProjectEditorReducer | undefined,
    action: Record<string, any>
): IProjectEditorReducer => {
    if (!state) {
        return initialLayoutState();
    }

    switch (action.type) {
        case MANUAL_LOOKUP_STRING: {
            return syncLegacyState({
                ...state,
                manualLookupString: action.manualLookupString,
                rightSidebar: ensureUtilityTab(state.rightSidebar, {
                    id: `sidebar-right-manual-${state.nextTabNumber}`,
                    type: "manual",
                    uid: "manual",
                    editorInstance: undefined
                }),
                nextTabNumber: state.nextTabNumber + 1
            });
        }
        case TAB_DOCK_CLOSE: {
            return initialLayoutState();
        }
        case TAB_DOCK_INIT: {
            if (action.savedWorkspaceState?.root) {
                const savedWorkspaceState =
                    action.savedWorkspaceState as IPersistedWorkspaceLayout;

                return syncLegacyState({
                    ...initialLayoutState(),
                    ...savedWorkspaceState,
                    manualLookupString: "",
                    maximizedPanelId:
                        savedWorkspaceState.maximizedPanelId || null
                });
            }

            const tabs = (action.initialOpenDocuments as IOpenDocument[]).map(
                (openDocument: IOpenDocument, index: number) =>
                    createEditorTab(`tab-${index + 1}`, openDocument)
            );

            return syncLegacyState({
                ...initialLayoutState(),
                root: createPanel("panel-1", tabs, action.initialIndex),
                nextTabNumber: tabs.length + 1
            });
        }
        case CLOSE_PANEL: {
            if (countPanels(state.root) <= 1) {
                return state;
            }

            const [root, removed] = removePanel(state.root, action.panelId);
            if (!removed) {
                return state;
            }

            return syncLegacyState({
                ...state,
                root,
                maximizedPanelId:
                    state.maximizedPanelId === action.panelId
                        ? null
                        : state.maximizedPanelId,
                activePanelId: containsPanel(root, state.activePanelId)
                    ? state.activePanelId
                    : findFirstPanelId(root)
            });
        }
        case TOGGLE_MAXIMIZE_PANEL: {
            return syncLegacyState({
                ...state,
                activePanelId: action.panelId,
                maximizedPanelId:
                    state.maximizedPanelId === action.panelId
                        ? null
                        : action.panelId
            });
        }
        case SET_ACTIVE_PANEL: {
            return syncLegacyState({
                ...state,
                activePanelId: action.panelId
            });
        }
        case PANEL_SWITCH_TAB: {
            const [root] = mapPanel(state.root, action.panelId, (panel) => ({
                ...panel,
                tabIndex: action.tabIndex
            }));
            return syncLegacyState({
                ...state,
                root,
                activePanelId: action.panelId
            });
        }
        case PANEL_REORDER_TABS: {
            const [root] = mapPanel(state.root, action.panelId, (panel) =>
                reorderTabs(panel, action.tabIds, action.tabIndex)
            );
            return syncLegacyState({
                ...state,
                root,
                activePanelId: action.panelId
            });
        }
        case PANEL_CLOSE_TAB: {
            return closePanelTabAndCollapse(
                state,
                action.panelId,
                action.tabId
            );
        }
        case TAB_DOCK_SWITCH_TAB: {
            const panelId = action.panelId || state.activePanelId;
            const [root] = mapPanel(state.root, panelId, (panel) => ({
                ...panel,
                tabIndex: resolveNthEditorTabIndex(panel, action.tabIndex)
            }));
            return syncLegacyState({
                ...state,
                root,
                activePanelId: panelId
            });
        }
        case TAB_DOCK_REARRANGE_TABS: {
            const panelId = action.panelId || state.activePanelId;
            const [root] = mapPanel(state.root, panelId, (panel) =>
                reorderTabs(panel, action.modifiedDock, action.newActiveIndex)
            );
            const nextState = syncLegacyState({
                ...state,
                root,
                activePanelId: panelId
            });
            storeTabDockState(
                action.projectUid,
                nextState.tabDock.openDocuments,
                nextState.tabDock.tabIndex
            );
            return nextState;
        }
        case TAB_DOCK_OPEN_NON_CLOUD_FILE: {
            if (action.init) {
                return state;
            }

            const activePanel = findPanelById(state.root, state.activePanelId);
            if (!activePanel) {
                return state;
            }

            const existingIndex = activePanel.tabs.findIndex(
                (tab) =>
                    tab.type === "editor" &&
                    tab.isNonCloudDocument &&
                    tab.uid === action.filename
            );
            if (existingIndex > -1) {
                const [root] = mapPanel(
                    state.root,
                    activePanel.id,
                    (panel) => ({
                        ...panel,
                        tabIndex: existingIndex
                    })
                );
                return syncLegacyState({
                    ...state,
                    root
                });
            }

            const file = nonCloudFiles.get(action.filename);
            if (!file) {
                return state;
            }

            let nonCloudFileAudioUrl;
            let nonCloudFileData;

            if (action.mimeType.startsWith("audio")) {
                const blob = new Blob([new Uint8Array(file.buffer)], {
                    type: action.mimeType
                });
                nonCloudFileAudioUrl = URL.createObjectURL(blob);
            } else {
                const utf8decoder = new TextDecoder();
                nonCloudFileData = utf8decoder.decode(file.buffer);
            }

            const nextTab = createEditorTab(`tab-${state.nextTabNumber}`, {
                uid: file.name,
                isNonCloudDocument: true,
                nonCloudFileAudioUrl,
                nonCloudFileData,
                editorInstance: undefined
            });

            const [root] = mapPanel(state.root, activePanel.id, (panel) => ({
                ...panel,
                tabs: [...panel.tabs, nextTab],
                tabIndex: panel.tabs.length
            }));

            const nextState = syncLegacyState({
                ...state,
                root,
                nextTabNumber: state.nextTabNumber + 1
            });
            storeTabDockState(
                action.projectUid,
                nextState.tabDock.openDocuments,
                nextState.tabDock.tabIndex
            );
            return nextState;
        }
        case TAB_DOCK_OPEN_TAB_BY_DOCUMENT_UID: {
            const activePanel = findPanelById(state.root, state.activePanelId);
            if (!activePanel) {
                return state;
            }

            const existingIndex = activePanel.tabs.findIndex(
                (tab) => tab.type === "editor" && tab.uid === action.documentUid
            );
            if (existingIndex > -1 && !action.init) {
                const [root] = mapPanel(
                    state.root,
                    activePanel.id,
                    (panel) => ({
                        ...panel,
                        tabIndex: existingIndex
                    })
                );
                return syncLegacyState({
                    ...state,
                    root
                });
            }

            const nextTab = createEditorTab(`tab-${state.nextTabNumber}`, {
                uid: action.documentUid,
                editorInstance: undefined
            });

            const [root] = mapPanel(state.root, activePanel.id, (panel) => ({
                ...panel,
                tabs: [...panel.tabs, nextTab],
                tabIndex: panel.tabs.length
            }));

            return syncLegacyState({
                ...state,
                root,
                nextTabNumber: state.nextTabNumber + 1
            });
        }
        case TAB_CLOSE: {
            const panelId = action.panelId || state.activePanelId;
            const panel = findPanelById(state.root, panelId);
            if (!panel) {
                return state;
            }

            const targetTab = action.tabId
                ? panel.tabs.find((tab) => tab.id === action.tabId)
                : panel.tabs.find(
                      (tab) =>
                          tab.type === "editor" &&
                          tab.uid === action.documentUid
                  );

            if (!targetTab) {
                return state;
            }

            const nextState = closePanelTabAndCollapse(
                state,
                panelId,
                targetTab.id
            );
            storeTabDockState(
                action.projectUid,
                nextState.tabDock.openDocuments,
                nextState.tabDock.tabIndex
            );
            return nextState;
        }
        case SPLIT_ACTIVE_PANEL: {
            const activePanel = findPanelById(state.root, state.activePanelId);
            if (!activePanel || activePanel.tabIndex < 0) {
                return state;
            }

            const currentTab = activePanel.tabs[activePanel.tabIndex];
            if (!currentTab) {
                return state;
            }

            const movedTab =
                activePanel.tabs.length > 1
                    ? currentTab
                    : { ...currentTab, id: `tab-${state.nextTabNumber}` };

            const sourceTabs =
                activePanel.tabs.length > 1
                    ? activePanel.tabs.filter((tab) => tab.id !== currentTab.id)
                    : activePanel.tabs;

            const [intermediateRoot] = mapPanel(
                state.root,
                activePanel.id,
                (panel) => ({
                    ...panel,
                    tabs: sourceTabs,
                    tabIndex:
                        activePanel.tabs.length > 1
                            ? Math.min(panel.tabIndex, sourceTabs.length - 1)
                            : panel.tabIndex
                })
            );

            const newPanelId = `panel-${state.nextPanelNumber}`;
            const splitId = `split-${state.nextSplitNumber}`;
            const [root, splitWorked] = splitPanel(
                intermediateRoot,
                activePanel.id,
                createPanel(newPanelId, [movedTab], 0),
                action.side,
                splitId
            );

            if (!splitWorked) {
                return state;
            }

            return syncLegacyState({
                ...state,
                root,
                activePanelId: newPanelId,
                nextPanelNumber: state.nextPanelNumber + 1,
                nextSplitNumber: state.nextSplitNumber + 1,
                nextTabNumber:
                    activePanel.tabs.length > 1
                        ? state.nextTabNumber
                        : state.nextTabNumber + 1
            });
        }
        case MOVE_PANEL: {
            const [root, moved] = movePanelToRootEdge(
                state.root,
                action.panelId,
                action.side,
                `split-${state.nextSplitNumber}`
            );

            if (!moved) {
                return state;
            }

            return syncLegacyState({
                ...state,
                root,
                activePanelId: action.panelId,
                nextSplitNumber: state.nextSplitNumber + 1
            });
        }
        case OPEN_SIDEBAR_TAB: {
            const sidebarKey = getSidebarKey(action.sidebar);
            const nextTab = createUtilityTab(
                `sidebar-${action.sidebar}-${action.tabType}-${state.nextTabNumber}`,
                action.tabType
            );

            return syncLegacyState({
                ...state,
                [sidebarKey]: ensureUtilityTab(state[sidebarKey], nextTab),
                nextTabNumber: state.nextTabNumber + 1
            });
        }
        case CLOSE_SIDEBAR_TAB: {
            const sidebarKey = getSidebarKey(action.sidebar);
            const sidebar = state[sidebarKey];
            if (!sidebar) {
                return state;
            }

            const tabs = sidebar.tabs.filter((tab) => tab.id !== action.tabId);
            return syncLegacyState({
                ...state,
                [sidebarKey]:
                    tabs.length > 0
                        ? {
                              ...sidebar,
                              tabs,
                              tabIndex: Math.min(
                                  sidebar.tabIndex,
                                  tabs.length - 1
                              )
                          }
                        : null
            });
        }
        case SET_SIDEBAR_TAB_INDEX: {
            const sidebarKey = getSidebarKey(action.sidebar);
            const sidebar = state[sidebarKey];
            if (!sidebar) {
                return state;
            }

            return syncLegacyState({
                ...state,
                [sidebarKey]: {
                    ...sidebar,
                    tabIndex: action.tabIndex
                }
            });
        }
        case TOGGLE_MANUAL_PANEL: {
            return ProjectEditorReducer(state, {
                type: SET_MANUAL_PANEL_OPEN,
                open: !state.manualVisible
            });
        }
        case SET_MANUAL_PANEL_OPEN: {
            if (!action.open) {
                const filteredTabs =
                    state.rightSidebar?.tabs.filter(
                        (tab) => tab.type !== "manual"
                    ) ?? [];
                return syncLegacyState({
                    ...state,
                    manualLookupString: "",
                    rightSidebar:
                        filteredTabs.length > 0
                            ? {
                                  ...state.rightSidebar!,
                                  tabs: filteredTabs,
                                  tabIndex: 0
                              }
                            : null
                });
            }

            return syncLegacyState({
                ...state,
                manualLookupString: "",
                rightSidebar: ensureUtilityTab(state.rightSidebar, {
                    id: `sidebar-right-manual-${state.nextTabNumber}`,
                    type: "manual",
                    uid: "manual",
                    editorInstance: undefined
                }),
                nextTabNumber: state.nextTabNumber + 1
            });
        }
        case SET_FILE_TREE_PANEL_OPEN: {
            if (!action.open) {
                const filteredTabs =
                    state.leftSidebar?.tabs.filter(
                        (tab) => tab.type !== "fileTree"
                    ) ?? [];
                return syncLegacyState({
                    ...state,
                    leftSidebar:
                        filteredTabs.length > 0
                            ? {
                                  ...state.leftSidebar!,
                                  tabs: filteredTabs,
                                  tabIndex: 0
                              }
                            : null
                });
            }

            return syncLegacyState({
                ...state,
                leftSidebar: ensureUtilityTab(state.leftSidebar, {
                    id: `sidebar-left-fileTree-${state.nextTabNumber}`,
                    type: "fileTree",
                    uid: "fileTree",
                    editorInstance: undefined
                }),
                nextTabNumber: state.nextTabNumber + 1
            });
        }
        default: {
            return state;
        }
    }
};

export default ProjectEditorReducer;
