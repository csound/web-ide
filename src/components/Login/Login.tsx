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
    LinearProgress
} from "@material-ui/core";
import {
    login,
    closeLoginDialog,
    createNewUser,
    createUserClearError
} from "./actions";
import {
    selectLoginRequesting,
    selectLoginFail,
    selectErrorCode,
    selectErrorMessage
} from "./selectors";
import { validateEmail } from "@root/utils";
import * as SS from "./styles";
import { assoc, isEmpty, pipe } from "ramda";
import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth";
import * as firebase from "firebase/app";
import { isElectron } from "@root/utils";

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

interface ILoginLocalState {
    email: string;
    newEmail: string;
    newEmailValid: boolean;
    password: string;
    newPassword: string;
    newPasswordConfirm: string;
    isCreatingUser: boolean;
}

const Login = () => {
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
        isCreatingUser: false
    } as ILoginLocalState);

    const switchToNewUser = () => {
        dispatch(createUserClearError());
        setLocalState(assoc("isCreatingUser", true, localState));
    };

    const switchToLogin = () => {
        dispatch(createUserClearError());
        setLocalState(assoc("isCreatingUser", false, localState));
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

    const loginView = (
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
                        onChange={e => {
                            setLocalState(
                                assoc("email", e.target.value, localState)
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
                        onChange={e => {
                            setLocalState(
                                assoc("password", e.target.value, localState)
                            );
                        }}
                        fullWidth
                        error={fail}
                        autoComplete="current-password"
                        onKeyPress={event =>
                            event.key === "Enter"
                                ? dispatch(
                                      login(
                                          localState.email,
                                          localState.password
                                      )
                                  )
                                : null
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
                    <Button onClick={switchToNewUser} color="primary">
                        {"New User"}
                    </Button>
                </DialogActions>
            </DialogContent>
            <StyledFirebaseAuth
                uiConfig={uiConfig}
                firebaseAuth={firebase.auth()}
            />
        </div>
    );

    const signupView = (
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
                    onChange={e => {
                        setLocalState(
                            pipe(
                                assoc("newEmail", e.target.value),
                                assoc(
                                    "newEmailValid",
                                    validateEmail(e.target.value)
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
                    onChange={e => {
                        setLocalState(
                            assoc("newPassword", e.target.value, localState)
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
                    onChange={e => {
                        setLocalState(
                            assoc(
                                "newPasswordConfirm",
                                e.target.value,
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
                <Button onClick={switchToLogin} color="primary">
                    Back
                </Button>
                <Button
                    onClick={() =>
                        dispatch(
                            createNewUser(localState.email, localState.password)
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
    return (
        <Dialog
            onClose={() => {
                dispatch(createUserClearError());
                dispatch(closeLoginDialog());
            }}
            open
        >
            {localState.isCreatingUser ? signupView : loginView}
            {errorBox}
        </Dialog>
    );
};

export default Login;
