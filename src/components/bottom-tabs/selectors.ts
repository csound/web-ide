import { RootState } from "@root/store";
import { BottomTab, IBottomTabsReducer } from "./types";
// import { path, prop } from "ramda";

export const selectOpenBottomTabs = (
    store: RootState
): BottomTab[] | undefined => {
    const state: IBottomTabsReducer | undefined = store.BottomTabsReducer;
    return state ? state.openTabs : ([] as BottomTab[]);
};

export const selectBottomTabIndex = (store: RootState): number => {
    const state: IBottomTabsReducer | undefined = store.BottomTabsReducer;
    return state ? state.index : -1;
};
