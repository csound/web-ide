// import { createSelector } from "reselect";

export const getAuthRequesting = ({ RouterReducer }) => {
    return RouterReducer.requesting;
};

export const getAuthFail = ({ RouterReducer }) => {
    return RouterReducer.failed;
};

export const getAuthState = ({ RouterReducer }) => {
    return RouterReducer.authenticated;
};
