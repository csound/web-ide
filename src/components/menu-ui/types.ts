export const OPEN_HEADER_DRAWER = "OPEN_HEADER_DRAWER";
export const CLOSE_HEADER_DRAWER = "CLOSE_HEADER_DRAWER";
export const TOGGLE_MOBILE_TOP_MENU = "TOGGLE_MOBILE_TOP_MENU";
export const CLOSE_MOBILE_TOP_MENU = "CLOSE_MOBILE_TOP_MENU";
export const PUSH_MOBILE_TOP_MENU_PATH = "PUSH_MOBILE_TOP_MENU_PATH";
export const POP_MOBILE_TOP_MENU_PATH = "POP_MOBILE_TOP_MENU_PATH";
export const RESET_MOBILE_TOP_MENU_PATH = "RESET_MOBILE_TOP_MENU_PATH";
export const TOGGLE_MOBILE_DOCK = "TOGGLE_MOBILE_DOCK";
export const CLOSE_MOBILE_DOCK = "CLOSE_MOBILE_DOCK";

interface MenuUiBaseAction {
    type: string;
    [key: string]: unknown;
}

export interface OpenHeaderDrawerAction extends MenuUiBaseAction {
    type: typeof OPEN_HEADER_DRAWER;
}

export interface CloseHeaderDrawerAction extends MenuUiBaseAction {
    type: typeof CLOSE_HEADER_DRAWER;
}

export interface ToggleMobileTopMenuAction extends MenuUiBaseAction {
    type: typeof TOGGLE_MOBILE_TOP_MENU;
}

export interface CloseMobileTopMenuAction extends MenuUiBaseAction {
    type: typeof CLOSE_MOBILE_TOP_MENU;
}

export interface PushMobileTopMenuPathAction extends MenuUiBaseAction {
    type: typeof PUSH_MOBILE_TOP_MENU_PATH;
    index: number;
}

export interface PopMobileTopMenuPathAction extends MenuUiBaseAction {
    type: typeof POP_MOBILE_TOP_MENU_PATH;
}

export interface ResetMobileTopMenuPathAction extends MenuUiBaseAction {
    type: typeof RESET_MOBILE_TOP_MENU_PATH;
}

export interface ToggleMobileDockAction extends MenuUiBaseAction {
    type: typeof TOGGLE_MOBILE_DOCK;
}

export interface CloseMobileDockAction extends MenuUiBaseAction {
    type: typeof CLOSE_MOBILE_DOCK;
}

export type MenuUiActionTypes =
    | OpenHeaderDrawerAction
    | CloseHeaderDrawerAction
    | ToggleMobileTopMenuAction
    | CloseMobileTopMenuAction
    | PushMobileTopMenuPathAction
    | PopMobileTopMenuPathAction
    | ResetMobileTopMenuPathAction
    | ToggleMobileDockAction
    | CloseMobileDockAction;
