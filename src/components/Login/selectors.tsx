import { IStore } from "../../db/interfaces";

export const selectLoginRequesting = ({ LoginReducer }: IStore) => {
    return LoginReducer.requesting;
};

export const selectLoginFail = ({ LoginReducer }: IStore) => {
    return LoginReducer.failed;
};

export const selectAuthenticated = ({ LoginReducer }: IStore) => {
    return LoginReducer.authenticated;
};
