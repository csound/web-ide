// import { createSelector } from "reselect";
import { State } from "./reducer";

export const selectUserProjects = (store: any) => {
    const state: State = store.ProfileReducer;
    return state.userProjects;
};

export const selectUserProfile = (store: any) => {
    const state: State = store.ProfileReducer;
    return state.userProfile;
};

export const selectUserImageURL = (store: any) => {
    const state: State = store.ProfileReducer;
    return state.userImageURL;
};
