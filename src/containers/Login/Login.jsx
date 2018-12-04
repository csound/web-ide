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
import { login } from "./actions";
import { getLoginRequesting, getLoginFail } from "./selectors";

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            email: "",
            password: ""
        };
    }
    render() {
        return (
            <Dialog open>
                <DialogTitle>Login</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter your email address and password
                    </DialogContentText>
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
                    />

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
                        onClick={() =>
                            this.props.login(
                                this.state.email,
                                this.state.password
                            )
                        }
                        color="primary"
                    >
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}


const mapStateToProps = (store, ownProp) => {
    return {
        requesting: getLoginRequesting(store),
        fail: getLoginFail(store)
    };
};

const mapDispatchToProps = (dispatch) => ({
    login,
});


export default connect(mapStateToProps, mapDispatchToProps)(Login);
