import { State } from "./reducer";

export const selectTags = (store: any) => {
    const state: State = store.HomeReducer;
    return state.tags;
};
