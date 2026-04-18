import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "@root/store";
import {
    Button,
    Dialog,
    TextField,
    LinearProgress,
    Link,
    useMediaQuery
} from "@mui/material";
import {
    login,
    loginWithProvider,
    closeLoginDialog,
    createNewUser,
    createUserClearError,
    resetPassword
} from "./actions";
import {
    selectLoginRequesting,
    selectLoginFail,
    selectErrorCode,
    selectErrorMessage,
    selectLoginDialogMode
} from "./selectors";
import { validateEmail, isElectron } from "@root/utils";
import * as SS from "./styles";
import { assoc, isEmpty, pipe } from "ramda";
import { LoginDialogMode } from "./types";

type LoginMode = LoginDialogMode;

interface ILoginLocalState {
    email: string;
    newEmail: string;
    newEmailValid: boolean;
    password: string;
    newPassword: string;
    newPasswordConfirm: string;
    loginMode: LoginMode;
}

const Login = (): React.ReactElement => {
    const dispatch = useDispatch();
    const errorCode = useSelector(selectErrorCode);
    const errorMessage = useSelector(selectErrorMessage);
    const fail = useSelector(selectLoginFail);
    const requesting = useSelector(selectLoginRequesting);
    const dialogMode = useSelector(selectLoginDialogMode);
    const isCompactDialog = useMediaQuery("(max-width:640px)");
    const [localState, setLocalState] = useState({
        email: "",
        newEmail: "",
        newEmailValid: false,
        password: "",
        newPassword: "",
        newPasswordConfirm: "",
        loginMode: dialogMode
    } as ILoginLocalState);

    useEffect(() => {
        setLocalState((previousState) => ({
            ...previousState,
            loginMode: dialogMode
        }));
    }, [dialogMode]);

    const switchLoginMode = (loginMode: LoginMode) => {
        dispatch(createUserClearError());
        setLocalState(assoc("loginMode", loginMode, localState));
    };

    const handleClose = () => {
        dispatch(createUserClearError());
        dispatch(closeLoginDialog());
    };

    const errorBox = !isEmpty(errorMessage) && errorMessage && (
        <div css={SS.errorBox}>
            <h5>{"Error " + errorCode}</h5>
            <p>{errorMessage}</p>
        </div>
    );

    const disabledBool =
        localState.newPasswordConfirm.length < 6 ||
        localState.newPassword.length < 6 ||
        localState.newPasswordConfirm !== localState.newPassword ||
        !localState.newEmailValid;

    const providerButtons = () => (
        <>
            <div css={SS.providerDivider}>or continue with</div>
            <div css={SS.providerButtonsContainer}>
                <Button
                    onClick={() => dispatch(loginWithProvider("google"))}
                    color="primary"
                    variant="outlined"
                    fullWidth
                    css={SS.providerButton}
                >
                    {isElectron
                        ? "Continue with Google (redirect)"
                        : "Continue with Google"}
                </Button>
                <Button
                    onClick={() => dispatch(loginWithProvider("facebook"))}
                    color="primary"
                    variant="outlined"
                    fullWidth
                    css={SS.providerButton}
                >
                    {isElectron
                        ? "Continue with Facebook (redirect)"
                        : "Continue with Facebook"}
                </Button>
            </div>
        </>
    );

    const progressBar = (
        <div
            css={SS.progressContainer}
            style={{
                transition: "opacity .1s ease-in",
                opacity: requesting ? 1 : 0
            }}
        >
            <LinearProgress />
        </div>
    );

    const loginView = () => (
        <div css={SS.dialogShell}>
            <div css={SS.dialogHeader}>
                <span css={SS.dialogEyebrow}>Account</span>
                <h2 css={SS.dialogTitle}>Sign in</h2>
                <p css={SS.dialogSubtitle}>
                    Sign in to save projects and create new ones from home.
                </p>
            </div>
            <div css={SS.dialogBody}>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        dispatch(login(localState.email, localState.password));
                    }}
                >
                    <div css={SS.fieldStack}>
                        <TextField
                            autoFocus
                            id="email"
                            label="Email Address"
                            type="email"
                            value={localState.email}
                            onChange={(event) => {
                                setLocalState(
                                    assoc(
                                        "email",
                                        event.target.value,
                                        localState
                                    )
                                );
                            }}
                            fullWidth
                            error={fail}
                            autoComplete="current-email"
                            InputLabelProps={{ shrink: true }}
                            css={SS.authField}
                        />
                        <TextField
                            id="password"
                            label="Password"
                            type="password"
                            value={localState.password}
                            onChange={(event) => {
                                setLocalState(
                                    assoc(
                                        "password",
                                        event.target.value,
                                        localState
                                    )
                                );
                            }}
                            fullWidth
                            error={fail}
                            autoComplete="current-password"
                            InputLabelProps={{ shrink: true }}
                            css={SS.authField}
                        />
                    </div>
                    <div css={SS.centerLink} style={{ marginTop: 12 }}>
                        <Link
                            css={SS.subtleLink}
                            onClick={() => switchLoginMode("reset")}
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <div css={SS.actionStack} style={{ marginTop: 14 }}>
                        <Button
                            type="submit"
                            color="primary"
                            variant="contained"
                            fullWidth
                        >
                            Sign in
                        </Button>
                        <Button
                            onClick={() => switchLoginMode("create")}
                            color="primary"
                            fullWidth
                            css={SS.secondaryAction}
                        >
                            Create account
                        </Button>
                    </div>
                </form>
                {progressBar}
                {providerButtons()}
            </div>
        </div>
    );

    const resetView = () => (
        <div css={SS.dialogShell}>
            <div css={SS.dialogHeader}>
                <span css={SS.dialogEyebrow}>Account recovery</span>
                <h2 css={SS.dialogTitle}>Reset password</h2>
                <p css={SS.dialogSubtitle}>
                    Enter your email to get a reset link.
                </p>
            </div>
            <div css={SS.dialogBody}>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (localState.newEmailValid) {
                            dispatch(resetPassword(localState.email));
                            switchLoginMode("login");
                        }
                    }}
                >
                    <div css={SS.fieldStack}>
                        <TextField
                            autoFocus
                            id="email"
                            label="Email Address"
                            type="email"
                            value={localState.email}
                            onChange={(event) => {
                                setLocalState(
                                    pipe(
                                        assoc("email", event.target.value),
                                        assoc(
                                            "newEmailValid",
                                            validateEmail(event.target.value)
                                        )
                                    )(localState)
                                );
                            }}
                            fullWidth
                            error={fail}
                            autoComplete="current-email"
                            InputLabelProps={{ shrink: true }}
                            css={SS.authField}
                        />
                    </div>
                    <div css={SS.actionStack} style={{ marginTop: 14 }}>
                        <Button
                            onClick={() => switchLoginMode("login")}
                            color="primary"
                            fullWidth
                            css={SS.secondaryAction}
                        >
                            Back
                        </Button>
                        <Button
                            type="submit"
                            color="primary"
                            variant="contained"
                            disabled={!localState.newEmailValid}
                            fullWidth
                        >
                            Send reset link
                        </Button>
                    </div>
                </form>
                {progressBar}
            </div>
        </div>
    );

    const signupView = () => (
        <div css={SS.dialogShell}>
            <div css={SS.dialogHeader}>
                <span css={SS.dialogEyebrow}>New account</span>
                <h2 css={SS.dialogTitle}>Create your account</h2>
                <p css={SS.dialogSubtitle}>
                    Create an account to save projects and start new ones from
                    home.
                </p>
            </div>
            <div css={SS.dialogBody}>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (!disabledBool) {
                            dispatch(
                                createNewUser(
                                    localState.newEmail,
                                    localState.newPassword
                                )
                            );
                        }
                    }}
                >
                    <div css={SS.fieldStack}>
                        <TextField
                            autoFocus
                            id="new-email"
                            label="Email Address"
                            type="email"
                            value={localState.newEmail}
                            onChange={(event) => {
                                setLocalState(
                                    pipe(
                                        assoc("newEmail", event.target.value),
                                        assoc(
                                            "newEmailValid",
                                            validateEmail(event.target.value)
                                        )
                                    )(localState)
                                );
                            }}
                            fullWidth
                            error={!localState.newEmailValid}
                            InputLabelProps={{ shrink: true }}
                            css={SS.authField}
                        />
                        <p css={SS.helperCopy}>Use 6 or more characters.</p>
                        <TextField
                            id="new-password"
                            label="New Password"
                            type="password"
                            value={localState.newPassword}
                            onChange={(event) => {
                                setLocalState(
                                    assoc(
                                        "newPassword",
                                        event.target.value,
                                        localState
                                    )
                                );
                            }}
                            fullWidth
                            error={localState.newPassword.length < 5}
                            autoComplete="new-password"
                            InputLabelProps={{ shrink: true }}
                            css={SS.authField}
                        />
                        <TextField
                            id="new-password-confirm"
                            label="Confirm New Password"
                            type="password"
                            value={localState.newPasswordConfirm}
                            onChange={(event) => {
                                setLocalState(
                                    assoc(
                                        "newPasswordConfirm",
                                        event.target.value,
                                        localState
                                    )
                                );
                            }}
                            fullWidth
                            error={
                                localState.newPasswordConfirm.length < 5 ||
                                localState.newPassword.length < 5 ||
                                localState.newPasswordConfirm !==
                                    localState.newPassword
                            }
                            autoComplete="new-password"
                            InputLabelProps={{ shrink: true }}
                            css={SS.authField}
                        />
                    </div>
                    <div css={SS.actionStack} style={{ marginTop: 14 }}>
                        <Button
                            onClick={() => switchLoginMode("login")}
                            color="primary"
                            fullWidth
                            css={SS.secondaryAction}
                        >
                            Back
                        </Button>
                        <Button
                            type="submit"
                            color="primary"
                            variant="contained"
                            disabled={disabledBool}
                            fullWidth
                        >
                            Create account
                        </Button>
                    </div>
                </form>
                {progressBar}
                {providerButtons()}
            </div>
        </div>
    );

    const renderView = (loginMode: LoginMode) => {
        switch (loginMode) {
            case "login": {
                return loginView();
            }
            case "create": {
                return signupView();
            }
            case "reset": {
                return resetView();
            }
        }
    };

    return (
        <Dialog
            onClose={handleClose}
            open
            fullWidth
            maxWidth="xs"
            fullScreen={isCompactDialog}
            scroll="body"
            PaperProps={{
                sx: {
                    m: { xs: 0, sm: 2 },
                    borderRadius: { xs: 0, sm: 3 },
                    overflow: "hidden"
                }
            }}
        >
            {renderView(localState.loginMode)}
            {errorBox}
        </Dialog>
    );
};

export default Login;
