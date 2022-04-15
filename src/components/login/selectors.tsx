import { IStore } from "@store/types";

export const selectLoginRequesting = ({ LoginReducer }: IStore): boolean => {
    return LoginReducer.requesting;
};

export const selectErrorCode = ({
    LoginReducer
}: IStore): number | undefined => {
    return LoginReducer.errorCode;
};

export const selectErrorMessage = ({
    LoginReducer
}: IStore): string | undefined => {
    return LoginReducer.errorMessaage;
};

export const selectLoginFail = ({ LoginReducer }: IStore): boolean => {
    return LoginReducer.failed;
};

export const selectAuthenticated = ({ LoginReducer }: IStore): boolean => {
    return LoginReducer.authenticated;
};

export const selectLoggedInUid = ({
    LoginReducer
}: IStore): string | undefined => {
    return LoginReducer.loggedInUid;
};
