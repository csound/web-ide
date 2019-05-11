import React, { Component } from "react";
import Login from "../containers/Login/Login";
import Main from "../containers/Main/Main";
import { Route, Switch } from 'react-router-dom';
import { ConnectedRouter } from "connected-react-router";
import PrivateRoute from "./PrivateRoute";
import { checkAuth } from "./actions";
import { connect } from "react-redux";
import { History } from "history";

interface IRouterComponent {
    checkAuth: () => void;
    history: History;
}

class RouterComponent extends Component<IRouterComponent, any> {

    public componentDidMount() {
        this.props.checkAuth();
    }

    public render() {
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

export default connect( null, { checkAuth })(RouterComponent);
