const PREFIX = "PROJECT_EDITOR.";

// ACTION TYPES
export const MANUAL_LOOKUP_STRING = PREFIX + "MANUAL_LOOKUP_STRING";
export const SET_MANUAL_PANEL_OPEN = PREFIX + "SET_MANUAL_PANEL_OPEN";
export const SET_FILE_TREE_PANEL_OPEN = PREFIX + "SET_FILE_TREE_PANEL_OPEN";
export const OPEN_SIDEBAR_TAB = PREFIX + "OPEN_SIDEBAR_TAB";
export const CLOSE_SIDEBAR_TAB = PREFIX + "CLOSE_SIDEBAR_TAB";
export const SET_SIDEBAR_TAB_INDEX = PREFIX + "SET_SIDEBAR_TAB_INDEX";
export const SET_ACTIVE_PANEL = PREFIX + "SET_ACTIVE_PANEL";
export const PANEL_SWITCH_TAB = PREFIX + "PANEL_SWITCH_TAB";
export const PANEL_REORDER_TABS = PREFIX + "PANEL_REORDER_TABS";
export const PANEL_CLOSE_TAB = PREFIX + "PANEL_CLOSE_TAB";
export const SPLIT_ACTIVE_PANEL = PREFIX + "SPLIT_ACTIVE_PANEL";
export const MOVE_PANEL = PREFIX + "MOVE_PANEL";
export const CLOSE_PANEL = PREFIX + "CLOSE_PANEL";
export const TOGGLE_MAXIMIZE_PANEL = PREFIX + "TOGGLE_MAXIMIZE_PANEL";
export const TAB_DOCK_INIT = PREFIX + "TAB_DOCK_INIT";
export const TAB_DOCK_SWITCH_TAB = PREFIX + "TAB_DOCK_SWITCH_TAB";
export const TAB_DOCK_REARRANGE_TABS = PREFIX + "TAB_DOCK_REARRANGE_TABS";
export const TAB_DOCK_OPEN_NON_CLOUD_FILE =
    PREFIX + "TAB_DOCK_OPEN_NON_CLOUD_FILE";
export const TAB_DOCK_OPEN_TAB_BY_DOCUMENT_UID =
    PREFIX + "TAB_DOCK_OPEN_TAB_BY_DOCUMENT_UID";
export const TAB_DOCK_CLOSE = PREFIX + "TAB_DOCK_CLOSE";
export const TAB_CLOSE = PREFIX + "TAB_CLOSE";
export const TOGGLE_MANUAL_PANEL = PREFIX + "TOGGLE_MANUAL_PANEL";

// DATA TYPES
export interface IOpenDocument {
    uid: string;
    isNonCloudDocument?: boolean;
    nonCloudFileAudioUrl?: string | undefined;
    nonCloudFileData?: string | undefined;
    editorInstance?: any;
}

export interface ITabDock {
    tabIndex: number;
    openDocuments: IOpenDocument[];
}

export type SidebarPosition = "left" | "right" | "bottom";

export type SplitDirection = "horizontal" | "vertical";

export type WorkspaceTabType =
    | "editor"
    | "fileTree"
    | "manual"
    | "console"
    | "spectralAnalyzer"
    | "piano";

export interface IWorkspaceTab extends IOpenDocument {
    id: string;
    type: WorkspaceTabType;
}

export interface IWorkspacePanelNode {
    id: string;
    kind: "panel";
    tabs: IWorkspaceTab[];
    tabIndex: number;
}

export interface IWorkspaceSplitNode {
    id: string;
    kind: "split";
    direction: SplitDirection;
    first: IWorkspaceLayoutNode;
    second: IWorkspaceLayoutNode;
}

export type IWorkspaceLayoutNode = IWorkspacePanelNode | IWorkspaceSplitNode;

export interface IPersistedWorkspaceLayout {
    root: IWorkspaceLayoutNode;
    activePanelId: string;
    leftSidebar: IWorkspacePanelNode | null;
    rightSidebar: IWorkspacePanelNode | null;
    bottomSidebar: IWorkspacePanelNode | null;
    nextPanelNumber: number;
    nextSplitNumber: number;
    nextTabNumber: number;
    maximizedPanelId?: string | null;
}
