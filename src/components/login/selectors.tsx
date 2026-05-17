import { RootState } from "@root/store";
import { LoginDialogMode, PostAuthFlow } from "./types";

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
    return LoginReducer.errorMessage;
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

export const selectLoginDialogMode = ({
    LoginReducer
}: RootState): LoginDialogMode => {
    return LoginReducer.dialogMode;
};

export const selectPostAuthFlow = ({
    LoginReducer
}: RootState): PostAuthFlow => {
    return LoginReducer.postAuthFlow;
};
