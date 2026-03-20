import { UnknownAction } from "@reduxjs/toolkit";
import {
    CLOSE_HEADER_DRAWER,
    CLOSE_MOBILE_TOP_MENU,
    OPEN_HEADER_DRAWER,
    POP_MOBILE_TOP_MENU_PATH,
    PUSH_MOBILE_TOP_MENU_PATH,
    RESET_MOBILE_TOP_MENU_PATH,
    TOGGLE_MOBILE_TOP_MENU
} from "./types";

export interface IMenuUiReducer {
    isHeaderDrawerOpen: boolean;
    isMobileTopMenuOpen: boolean;
    mobileTopMenuPath: number[];
}

const INITIAL_STATE: IMenuUiReducer = {
    isHeaderDrawerOpen: false,
    isMobileTopMenuOpen: false,
    mobileTopMenuPath: []
};

const MenuUiReducer = (
    state: IMenuUiReducer | undefined,
    action: UnknownAction
): IMenuUiReducer => {
    if (!state) {
        return INITIAL_STATE;
    }

    switch (action.type) {
        case OPEN_HEADER_DRAWER: {
            if (state.isHeaderDrawerOpen) {
                return state;
            }
            return {
                ...state,
                isHeaderDrawerOpen: true
            };
        }
        case CLOSE_HEADER_DRAWER: {
            if (!state.isHeaderDrawerOpen) {
                return state;
            }
            return {
                ...state,
                isHeaderDrawerOpen: false
            };
        }
        case TOGGLE_MOBILE_TOP_MENU: {
            const nextOpen = !state.isMobileTopMenuOpen;
            return {
                ...state,
                isMobileTopMenuOpen: nextOpen,
                mobileTopMenuPath: nextOpen ? state.mobileTopMenuPath : []
            };
        }
        case CLOSE_MOBILE_TOP_MENU: {
            if (
                !state.isMobileTopMenuOpen &&
                state.mobileTopMenuPath.length === 0
            ) {
                return state;
            }
            return {
                ...state,
                isMobileTopMenuOpen: false,
                mobileTopMenuPath: []
            };
        }
        case PUSH_MOBILE_TOP_MENU_PATH: {
            const index = action.index as number;
            return {
                ...state,
                mobileTopMenuPath: [...state.mobileTopMenuPath, index]
            };
        }
        case POP_MOBILE_TOP_MENU_PATH: {
            if (state.mobileTopMenuPath.length === 0) {
                return state;
            }
            return {
                ...state,
                mobileTopMenuPath: state.mobileTopMenuPath.slice(0, -1)
            };
        }
        case RESET_MOBILE_TOP_MENU_PATH: {
            if (state.mobileTopMenuPath.length === 0) {
                return state;
            }
            return {
                ...state,
                mobileTopMenuPath: []
            };
        }
        default: {
            return state;
        }
    }
};

export default MenuUiReducer;
