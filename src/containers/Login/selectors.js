// import { createSelector } from "reselect";

export const selectLoginRequesting = ({ LoginReducer }) => {
    return LoginReducer.requesting;
};

export const selectLoginFail = ({ LoginReducer }) => {
    return LoginReducer.failed;
};
