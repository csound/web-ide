import {
    BottomTab,
    IBottomTabsReducer,
    CLOSE_BOTTOM_TAB,
    OPEN_BOTTOM_TAB,
    REORDER_TABS,
    SET_BOTTOM_TAB_INDEX
} from "./types";
import { append, assoc, equals, findIndex, pipe, propOr, reject } from "ramda";

const initState: IBottomTabsReducer = {
    index: 0,
    openTabs: ["console"]
};

const BottomTabs = (
    state: IBottomTabsReducer | undefined,
    action: any
): IBottomTabsReducer => {
    switch (action.type) {
        case OPEN_BOTTOM_TAB: {
            const safeState = state || initState;
            const tabIsAlreadyOpen: boolean = safeState.openTabs.includes(
                action.tab
            );
            return tabIsAlreadyOpen
                ? assoc(
                      "index",
                      findIndex(equals(action.tab), safeState.openTabs),
                      state
                  )
                : pipe(
                      assoc(
                          "openTabs",
                          append(
                              action.tab as BottomTab,
                              propOr({}, "openTabs", state)
                          )
                      ),
                      assoc("index", safeState.openTabs.length)
                  )(safeState);
        }
        case CLOSE_BOTTOM_TAB: {
            const safeState = state || initState;
            const newTabs = reject(
                equals(action.closeTab),
                safeState.openTabs || []
            );
            const newIndex =
                newTabs.length === 0
                    ? -1
                    : Math.min(safeState.index, newTabs.length - 1);
            return pipe(
                assoc("openTabs", newTabs),
                assoc("index", newIndex)
            )(safeState);
        }
        case SET_BOTTOM_TAB_INDEX: {
            return assoc("index", action.newIndex, state || initState);
        }

        case REORDER_TABS: {
            return pipe(
                assoc("index", action.newIndex),
                assoc("openTabs", action.newOrder)
            )(state || initState);
        }

        default: {
            return state || initState;
        }
    }
};

export default BottomTabs;
