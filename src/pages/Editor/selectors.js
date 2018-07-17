// import { createSelector } from "reselect";

export const getLoginRequesting = ({ LoginReducer }) => {
    return LoginReducer.requesting;
};

export const getLoginFail = ({ LoginReducer }) => {
    return LoginReducer.failed;
};
