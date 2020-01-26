import { IStore } from "@store/types";

export const selectLoginRequesting = ({ LoginReducer }: IStore) => {
    return LoginReducer.requesting;
};

export const selectLoginFail = ({ LoginReducer }: IStore) => {
    return LoginReducer.failed;
};

export const selectAuthenticated = ({ LoginReducer }: IStore) => {
    return LoginReducer.authenticated;
};

export const selectLoggedInUid = ({ LoginReducer }: IStore) => {
    return LoginReducer.loggedInUid;
};
