import React, { Component } from "react";
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
import { connect } from "react-redux";
import {
    login,
    closeLoginDialog,
    createNewUser,
    createUserClearError,
    thirdPartyAuthSuccess
} from "./actions";
import { IStore } from "../../db/interfaces";
import { selectLoginRequesting, selectLoginFail } from "./selectors";
import { validateEmail } from "../../utils";
import { loginStylesHOC } from "./styles";
import { isEmpty, merge } from "lodash";
import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth";
import * as firebase from "firebase/app";
import { isElectron } from "../../utils";

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

interface ILoginProps {
    errorCode: string;
    errorMessage: string;
    classes: any;
    fail: boolean;
    requesting: boolean;
}

interface ILoginDispatchProperties {
    closeLoginDialog: () => void;
    createNewUser: (email: string, password: string) => void;
    createUserClearError: () => void;
    login: (email: string, password: string) => void;
    thirdPartyAuthSuccess: (user: any) => void;
}

type ILogin = ILoginProps & ILoginDispatchProperties;

class Login extends Component<ILogin, ILoginLocalState> {
    protected unregisterAuthObserver: any;

    public readonly state: ILoginLocalState = {
        email: "",
        newEmail: "",
        newEmailValid: false,
        password: "",
        newPassword: "",
        newPasswordConfirm: "",
        isCreatingUser: false
    };

    constructor(props: ILogin) {
        super(props);
        this.switchToNewUser = this.switchToNewUser.bind(this);
        this.switchToLogin = this.switchToLogin.bind(this);
    }

    componentDidMount() {
        this.unregisterAuthObserver = firebase
            .auth()
            .onAuthStateChanged(
                user => !!user && this.props.thirdPartyAuthSuccess(user)
            );
    }

    componentWillUnmount() {
        this.unregisterAuthObserver();
    }

    public switchToNewUser() {
        this.props.createUserClearError();
        this.setState(
            merge(this.state, {
                isCreatingUser: true
            })
        );
    }

    public switchToLogin() {
        this.props.createUserClearError();
        this.setState(
            merge(this.state, {
                isCreatingUser: false
            })
        );
    }

    public render() {
        const { classes, closeLoginDialog } = this.props;
        const { isCreatingUser, newEmailValid } = this.state;

        const errorBox = !isEmpty(this.props.errorMessage) && (
            <div className={classes.errorBox}>
                <h5>{"Error " + this.props.errorCode}</h5>
                <p>{this.props.errorMessage}</p>
            </div>
        );

        const disabledBool =
            this.state.newPasswordConfirm.length < 6 ||
            this.state.newPassword.length < 6 ||
            this.state.newPasswordConfirm !== this.state.newPassword ||
            !newEmailValid;

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
                            value={this.state.email}
                            onChange={e => {
                                this.setState({ email: e.target.value });
                            }}
                            fullWidth
                            error={this.props.fail}
                            autoComplete="current-email"
                        />
                        <TextField
                            margin="dense"
                            id="password"
                            label="Password"
                            type="password"
                            value={this.state.password}
                            onChange={e => {
                                this.setState({ password: e.target.value });
                            }}
                            fullWidth
                            error={this.props.fail}
                            autoComplete="current-password"
                            onKeyPress={event =>
                                event.key === "Enter"
                                    ? this.props.login(
                                          this.state.email,
                                          this.state.password
                                      )
                                    : null
                            }
                        />
                    </form>
                    <div
                        style={{
                            transition: "opacity .1s ease-in",
                            opacity: this.props.requesting ? 1 : 0
                        }}
                    >
                        <LinearProgress />
                    </div>
                    <DialogActions>
                        <Button
                            onClick={() => {
                                this.props.login(
                                    this.state.email,
                                    this.state.password
                                );
                            }}
                            color="primary"
                        >
                            Login
                        </Button>
                        <Button
                            onClick={() => this.switchToNewUser()}
                            color="primary"
                        >
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
                <DialogContentText>
                    Please provide a valid email
                </DialogContentText>
                <form>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="new-email"
                        label="Email Address"
                        type="email"
                        value={this.state.newEmail}
                        onChange={e => {
                            this.setState({
                                newEmail: e.target.value,
                                newEmailValid: validateEmail(e.target.value)
                            });
                        }}
                        fullWidth
                        error={!this.state.newEmailValid}
                    />
                    <DialogContentText style={{ marginTop: "24px" }}>
                        Choose a good password of minimum 6 characters length
                    </DialogContentText>
                    <TextField
                        margin="dense"
                        id="new-password"
                        label="New Password"
                        type="password"
                        value={this.state.newPassword}
                        onChange={e => {
                            this.setState({ newPassword: e.target.value });
                        }}
                        fullWidth
                        error={this.state.newPassword.length < 5}
                        autoComplete="new-password"
                    />
                    <TextField
                        margin="dense"
                        id="new-password-confirm"
                        label="Confirm New Password"
                        type="password"
                        value={this.state.newPasswordConfirm}
                        onChange={e => {
                            this.setState({
                                newPasswordConfirm: e.target.value
                            });
                        }}
                        fullWidth
                        error={
                            this.state.newPasswordConfirm.length < 5 ||
                            this.state.newPassword.length < 5 ||
                            this.state.newPasswordConfirm !==
                                this.state.newPassword
                        }
                        autoComplete="new-password"
                    />
                </form>
                <div
                    style={{
                        transition: "opacity .1s ease-in",
                        opacity: this.props.requesting ? 1 : 0
                    }}
                >
                    <LinearProgress />
                </div>
                <DialogActions>
                    <Button
                        onClick={() => this.switchToLogin()}
                        color="primary"
                    >
                        Back
                    </Button>
                    <Button
                        onClick={() =>
                            this.props.createNewUser(
                                this.state.newEmail,
                                this.state.newPasswordConfirm
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
                    this.props.createUserClearError();
                    closeLoginDialog();
                }}
                open
            >
                {isCreatingUser ? signupView : loginView}
                {errorBox}
            </Dialog>
        );
    }
}

const mapStateToProps = (store: IStore, ownProp: any): ILoginProps => {
    return {
        errorCode: store.LoginReducer.errorCode,
        errorMessage: store.LoginReducer.errorMessage,
        classes: ownProp.classes,
        requesting: selectLoginRequesting(store),
        fail: selectLoginFail(store)
    };
};

const mapDispatchToProps = (dispatch: any): ILoginDispatchProperties => ({
    closeLoginDialog: () => dispatch(closeLoginDialog()),
    createNewUser: (email, password) =>
        dispatch(createNewUser(email, password)),
    createUserClearError: () => dispatch(createUserClearError()),
    login: (email, password) => dispatch(login(email, password)),
    thirdPartyAuthSuccess: user => dispatch(thirdPartyAuthSuccess(user))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(loginStylesHOC(Login));
