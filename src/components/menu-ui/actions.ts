import {
    CLOSE_HEADER_DRAWER,
    CLOSE_MOBILE_TOP_MENU,
    OPEN_HEADER_DRAWER,
    POP_MOBILE_TOP_MENU_PATH,
    PUSH_MOBILE_TOP_MENU_PATH,
    RESET_MOBILE_TOP_MENU_PATH,
    TOGGLE_MOBILE_TOP_MENU,
    TOGGLE_MOBILE_DOCK,
    CLOSE_MOBILE_DOCK,
    CloseHeaderDrawerAction,
    CloseMobileTopMenuAction,
    OpenHeaderDrawerAction,
    PopMobileTopMenuPathAction,
    PushMobileTopMenuPathAction,
    ResetMobileTopMenuPathAction,
    ToggleMobileTopMenuAction,
    ToggleMobileDockAction,
    CloseMobileDockAction
} from "./types";

export const openHeaderDrawer = (): OpenHeaderDrawerAction => ({
    type: OPEN_HEADER_DRAWER
});

export const closeHeaderDrawer = (): CloseHeaderDrawerAction => ({
    type: CLOSE_HEADER_DRAWER
});

export const toggleMobileTopMenu = (): ToggleMobileTopMenuAction => ({
    type: TOGGLE_MOBILE_TOP_MENU
});

export const closeMobileTopMenu = (): CloseMobileTopMenuAction => ({
    type: CLOSE_MOBILE_TOP_MENU
});

export const pushMobileTopMenuPath = (
    index: number
): PushMobileTopMenuPathAction => ({
    type: PUSH_MOBILE_TOP_MENU_PATH,
    index
});

export const popMobileTopMenuPath = (): PopMobileTopMenuPathAction => ({
    type: POP_MOBILE_TOP_MENU_PATH
});

export const resetMobileTopMenuPath = (): ResetMobileTopMenuPathAction => ({
    type: RESET_MOBILE_TOP_MENU_PATH
});

export const toggleMobileDock = (): ToggleMobileDockAction => ({
    type: TOGGLE_MOBILE_DOCK
});

export const closeMobileDock = (): CloseMobileDockAction => ({
    type: CLOSE_MOBILE_DOCK
});
