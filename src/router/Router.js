import React from "react";
import Login from "../views/containers/Login";
import Main from "../views/containers/Main";
import { Route, Router, Switch } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";

const RouterComponent = props => {
    return (
        <div>
            <Router {...props}>
                <Switch>
                    <Route path="/login" component={Login} />
                    <Route path="/logout" component={Login} />
                    <Route path="/" component={Main} />
                    {/* <PrivateRoute {...props} path="/main" component={Main} /> */}
                    {/* <PrivateRoute {...props} path="/" component={Main} /> */}
                </Switch>
            </Router>
        </div>
    );
};

export default RouterComponent;
