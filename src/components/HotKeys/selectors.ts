// import { createSelector } from "reselect";
import { State } from "./reducer";

export const selectKeyHandlers = (store: any) => {
    const state: State = store.HotKeysReducer;
    return state.keyHandlers;
};

export const selectKeyMaps = (store: any) => {
    const state: State = store.HotKeysReducer;
    return state.keyMap;
};
