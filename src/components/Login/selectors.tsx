import { IStore } from "@store/types";

export const selectLoginRequesting = ({ LoginReducer }: IStore) => {
    return LoginReducer.requesting;
};

export const selectErrorCode = ({ LoginReducer }: IStore) => {
    return LoginReducer.errorCode;
};

export const selectErrorMessage = ({ LoginReducer }: IStore) => {
    return LoginReducer.errorMessaage;
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
