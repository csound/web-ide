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
import { login, closeLoginDialog } from "./actions";
import { IStore } from "../../db/interfaces";
import { getLoginRequesting, getLoginFail } from "./selectors";

interface ILoginLocalState {
    email: string;
    password: string;
}

interface ILoginProps {
    fail: boolean;
    requesting: boolean;
}

interface ILoginDispatchProperties {
    closeLoginDialog: () => void;
    login: (email: string, password: string) => void;
}

type ILogin = ILoginProps & ILoginDispatchProperties;

class Login extends Component<ILogin, ILoginLocalState> {

    public readonly state: ILoginLocalState = {
        email: "",
        password: "",
    }

    public render() {
        const { closeLoginDialog } = this.props;
        return (
            <Dialog onClose={() => closeLoginDialog() } open>
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
                </DialogContent>
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
                        Submit
                    </Button>
                </DialogActions>
                </Dialog>
            );
        }
    }

const mapStateToProps = (store: IStore, ownProp: any): ILoginProps => {
    return {
        requesting: getLoginRequesting(store),
        fail: getLoginFail(store)
    };
};

const mapDispatchToProps = (dispatch: any): ILoginDispatchProperties => ({
    closeLoginDialog: () => dispatch(closeLoginDialog()),
    login: (email, password) => dispatch(
        login(email, password)
    )
});

export default connect(mapStateToProps, mapDispatchToProps )(Login);
