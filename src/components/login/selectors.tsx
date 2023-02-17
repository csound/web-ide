import { RootState } from "@root/store";

export const selectLoginRequesting = ({ LoginReducer }: RootState): boolean => {
    return LoginReducer.requesting;
};

export const selectErrorCode = ({
    LoginReducer
}: RootState): number | undefined => {
    return LoginReducer.errorCode;
};

export const selectErrorMessage = ({
    LoginReducer
}: RootState): string | undefined => {
    return LoginReducer.errorMessaage;
};

export const selectLoginFail = ({ LoginReducer }: RootState): boolean => {
    return LoginReducer.failed;
};

export const selectAuthenticated = ({ LoginReducer }: RootState): boolean => {
    return LoginReducer.authenticated;
};

export const selectLoggedInUid = ({
    LoginReducer
}: RootState): string | undefined => {
    return LoginReducer.loggedInUid;
};
