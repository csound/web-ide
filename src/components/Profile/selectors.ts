import { createSelector } from "reselect";
import { State } from "./reducer";

export const selectUserProjects = (store: any) => {
    const state: State = store.ProfileReducer;
    return state.userProjects;
};
