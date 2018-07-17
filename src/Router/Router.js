import React, { Component } from "react";
import Login from "../containers/Login/Login";
import Main from "../containers/Main/Main";
import { Route, Switch } from "react-router-dom";
import { ConnectedRouter } from "connected-react-router";
import PrivateRoute from "./PrivateRoute";
import { checkAuth } from "./actions";
import { connect } from "react-redux";

class RouterComponent extends Component {
    constructor(props) {
        super(props);

        props.checkAuth();
    }
    render() {
        return (
            <ConnectedRouter history={this.props.history} {...this.props}>
                <Switch>
                    <Route path="/login" component={Login} />
                    <Route path="/logout" component={Login} />
                    <PrivateRoute {...this.props} path="/" component={Main} />
                    <PrivateRoute {...this.props} path="" component={Main} />
                    <PrivateRoute
                        {...this.props}
                        path="/dashboard"
                        component={Main}
                    />
                </Switch>
            </ConnectedRouter>
        );
    }
}

export default connect(
    null,
    { checkAuth }
)(RouterComponent);
