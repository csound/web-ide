const PREFIX = "PROJECT_EDITOR.";

// ACTION TYPES
export const TAB_DOCK_INIT_SWITCH_TAB = PREFIX + "TAB_DOCK_INIT_SWITCH_TAB";
export const TAB_DOCK_SWITCH_TAB = PREFIX + "TAB_DOCK_SWITCH_TAB";
export const TAB_DOCK_INITIAL_OPEN_TAB_BY_DOCUMENT_UID =
    PREFIX + "TAB_DOCK_INITIAL_OPEN_TAB_BY_DOCUMENT_UID";
export const TAB_DOCK_OPEN_TAB_BY_DOCUMENT_UID =
    PREFIX + "TAB_DOCK_OPEN_TAB_BY_DOCUMENT_UID";
export const TAB_CLOSE = PREFIX + "TAB_CLOSE";
export const STORE_EDITOR_INSTANCE = PREFIX + "STORE_EDITOR_INSTANCE";

// DATA TYPES
export interface IOpenDocument {
    editorInstance: any;
    uid: string;
}
export interface ITabDock {
    tabIndex: number;
    openDocuments: IOpenDocument[];
}
