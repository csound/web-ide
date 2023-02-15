const PREFIX = "PROJECT_EDITOR.";

// ACTION TYPES
export const MANUAL_LOOKUP_STRING = PREFIX + "MANUAL_LOOKUP_STRING";
export const SET_MANUAL_PANEL_OPEN = PREFIX + "SET_MANUAL_PANEL_OPEN";
export const SET_FILE_TREE_PANEL_OPEN = PREFIX + "SET_FILE_TREE_PANEL_OPEN";
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
export const STORE_EDITOR_INSTANCE = PREFIX + "STORE_EDITOR_INSTANCE";

// DATA TYPES
export interface IOpenDocument {
    editorInstance: any;
    uid: string;
    isNonCloudDocument?: boolean;
    nonCloudFileAudioUrl?: string | undefined;
    nonCloudFileData?: string | undefined;
}

export interface ITabDock {
    tabIndex: number;
    openDocuments: IOpenDocument[];
}
