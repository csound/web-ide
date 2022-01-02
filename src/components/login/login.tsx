import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    TextField,
    LinearProgress,
    Link
} from "@material-ui/core";
import {
    login,
    closeLoginDialog,
    createNewUser,
    createUserClearError,
    resetPassword
} from "./actions";
import {
    selectLoginRequesting,
    selectLoginFail,
    selectErrorCode,
    selectErrorMessage
} from "./selectors";
import { validateEmail, isElectron } from "@root/utils";
import * as SS from "./styles";
import { assoc, isEmpty, pipe } from "ramda";
import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth";
import firebase from "firebase/compat/app";
import { getAuth } from "firebase/auth";
import "firebase/compat/auth";

// Configure FirebaseUI.
const uiConfig = {
    signInFlow: isElectron ? "redirect" : "popup",
    signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.FacebookAuthProvider.PROVIDER_ID
    ],
    callbacks: {
        signInSuccessWithAuthResult: () => false
    }
};

type LoginMode = "login" | "create" | "reset";

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
    const [localState, setLocalState] = useState({
        email: "",
        newEmail: "",
        newEmailValid: false,
        password: "",
        newPassword: "",
        newPasswordConfirm: "",
        loginMode: "login"
    } as ILoginLocalState);

    const switchLoginMode = (loginMode: LoginMode) => {
        dispatch(createUserClearError());
        setLocalState(assoc("loginMode", loginMode, localState));
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

    const loginView = () => (
        <div>
            <DialogTitle>Login</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Please enter your email address and password
                </DialogContentText>
                <form>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="email"
                        label="Email Address"
                        type="email"
                        value={localState.email}
                        onChange={(event) => {
                            setLocalState(
                                assoc("email", event.target.value, localState)
                            );
                        }}
                        fullWidth
                        error={fail}
                        autoComplete="current-email"
                    />
                    <TextField
                        margin="dense"
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
                        onKeyPress={(event) =>
                            event.key === "Enter" &&
                            dispatch(
                                login(localState.email, localState.password)
                            )
                        }
                    />
                </form>
                <div
                    style={{
                        transition: "opacity .1s ease-in",
                        opacity: requesting ? 1 : 0
                    }}
                >
                    <LinearProgress />
                </div>
                <DialogActions>
                    <Button
                        onClick={() => {
                            dispatch(
                                login(localState.email, localState.password)
                            );
                        }}
                        color="primary"
                    >
                        Login
                    </Button>
                    <Button
                        onClick={() => switchLoginMode("create")}
                        color="primary"
                    >
                        {"New User"}
                    </Button>
                </DialogActions>
            </DialogContent>
            <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={getAuth()} />
            <div css={SS.centerLink}>
                <Link onClick={() => switchLoginMode("reset")}>
                    Forgot password?
                </Link>
            </div>
        </div>
    );

    const resetView = () => (
        <div>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Please enter your email address
                </DialogContentText>
                <form>
                    <TextField
                        autoFocus
                        margin="dense"
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
                    />
                </form>
                <div
                    style={{
                        transition: "opacity .1s ease-in",
                        opacity: requesting ? 1 : 0
                    }}
                >
                    <LinearProgress />
                </div>
                <DialogActions>
                    <Button
                        onClick={() => switchLoginMode("login")}
                        color="primary"
                    >
                        Back
                    </Button>
                    <Button
                        onClick={() => {
                            dispatch(resetPassword(localState.email));
                            switchLoginMode("login");
                        }}
                        color="primary"
                        disabled={!localState.newEmailValid}
                    >
                        {"Reset"}
                    </Button>
                </DialogActions>
            </DialogContent>
        </div>
    );

    const signupView = () => (
        <div style={{ padding: "45px" }}>
            <DialogTitle>New Account</DialogTitle>
            <DialogContentText>Please provide a valid email</DialogContentText>
            <form>
                <TextField
                    autoFocus
                    margin="dense"
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
                />
                <DialogContentText style={{ marginTop: "24px" }}>
                    Choose a good password of minimum 6 characters length
                </DialogContentText>
                <TextField
                    margin="dense"
                    id="new-password"
                    label="New Password"
                    type="password"
                    value={localState.newPassword}
                    onChange={(event) => {
                        setLocalState(
                            assoc("newPassword", event.target.value, localState)
                        );
                    }}
                    fullWidth
                    error={localState.newPassword.length < 5}
                    autoComplete="new-password"
                />
                <TextField
                    margin="dense"
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
                        localState.newPasswordConfirm !== localState.newPassword
                    }
                    autoComplete="new-password"
                />
            </form>
            <div
                style={{
                    transition: "opacity .1s ease-in",
                    opacity: requesting ? 1 : 0
                }}
            >
                <LinearProgress />
            </div>
            <DialogActions>
                <Button
                    onClick={() => switchLoginMode("login")}
                    color="primary"
                >
                    Back
                </Button>
                <Button
                    onClick={() =>
                        dispatch(
                            createNewUser(
                                localState.newEmail,
                                localState.newPassword
                            )
                        )
                    }
                    color="primary"
                    disabled={disabledBool}
                >
                    {"Create"}
                </Button>
            </DialogActions>
        </div>
    );

    const renderView = (loginMode: LoginMode) => {
        switch (loginMode) {
            case "login":
                return loginView();
            case "create":
                return signupView();
            case "reset":
                return resetView();
        }
    };

    return (
        <Dialog
            onClose={() => {
                dispatch(createUserClearError());
                dispatch(closeLoginDialog());
            }}
            open
        >
            {renderView(localState.loginMode)}
            {errorBox}
        </Dialog>
    );
};

export default Login;
