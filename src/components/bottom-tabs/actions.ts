import {
    BottomTab,
    CLOSE_BOTTOM_TAB,
    OPEN_BOTTOM_TAB,
    REORDER_TABS,
    SET_BOTTOM_TAB_INDEX
} from "./types";

export const setBottomTabIndex = (newIndex: number) => {
    return async (dispatch: any) =>
        dispatch({ type: SET_BOTTOM_TAB_INDEX, newIndex });
};

export const reorderBottomTabs = (newOrder: BottomTab[], newIndex: number) => {
    return async (dispatch: any) =>
        dispatch({ type: REORDER_TABS, newIndex, newOrder });
};

export const openBottomTab = (tab: BottomTab) => {
    return async (dispatch: any) => dispatch({ type: OPEN_BOTTOM_TAB, tab });
};

export const closeBottomTab = (closeTab: BottomTab) => {
    return async (dispatch: any) =>
        dispatch({ type: CLOSE_BOTTOM_TAB, closeTab });
};
