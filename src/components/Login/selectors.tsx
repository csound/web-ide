import { IStore } from "../../db/interfaces";

export const selectLoginRequesting = ({ LoginReducer }: IStore) => {
    return LoginReducer.requesting;
};

export const selectLoginFail = ({ LoginReducer }: IStore) => {
    return LoginReducer.failed;
};

export const getLoginRequesting = ({ LoginReducer }: IStore) => {
    return LoginReducer.requesting;
};

export const getLoginFail = ({ LoginReducer }: IStore) => {
    return LoginReducer.failed;
};
