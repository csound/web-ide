import { RootState } from "@root/store";

export const selectIsHeaderDrawerOpen = (state: RootState): boolean =>
    state.MenuUiReducer.isHeaderDrawerOpen;

export const selectIsMobileTopMenuOpen = (state: RootState): boolean =>
    state.MenuUiReducer.isMobileTopMenuOpen;

export const selectMobileTopMenuPath = (state: RootState): number[] =>
    state.MenuUiReducer.mobileTopMenuPath;

export const selectIsMobileDockOpen = (state: RootState): boolean =>
    state.MenuUiReducer.isMobileDockOpen;
