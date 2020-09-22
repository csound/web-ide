const PREFIX = "BOTTOM_TABS.";

// ACTION TYPES
export const OPEN_BOTTOM_TAB = PREFIX + "OPEN_BOTTOM_TAB";
export const CLOSE_BOTTOM_TAB = PREFIX + "CLOSE_BOTTOM_TAB";
export const REORDER_TABS = PREFIX + "REORDER_TABS";
export const SET_BOTTOM_TAB_INDEX = PREFIX + "SET_BOTTOM_TAB_INDEX";

export type BottomTab = "console" | "spectralAnalyzer" | "piano";

export interface IBottomTabsReducer {
    index: number;
    openTabs: BottomTab[];
}
