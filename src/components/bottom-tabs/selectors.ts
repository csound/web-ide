import { IStore } from "@store/types";
import { BottomTab, IBottomTabsReducer } from "./types";
// import { path, prop } from "ramda";

export const selectOpenBottomTabs = (
    store: IStore
): BottomTab[] | undefined => {
    const state: IBottomTabsReducer | undefined = store.BottomTabsReducer;
    return state ? state.openTabs : ([] as BottomTab[]);
};

export const selectBottomTabIndex = (store: IStore): number => {
    const state: IBottomTabsReducer | undefined = store.BottomTabsReducer;
    return state ? state.index : -1;
};
