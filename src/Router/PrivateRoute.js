import { Route, Redirect } from "react-router-dom";
import React from "react";
import { getAuthState, getAuthRequesting } from "./selectors";
import { connect } from "react-redux";
import LinearProgress from "@material-ui/core/LinearProgress";

const PrivateRoute = ({ component: Component, auth, requesting, ...rest }) => {
    const render = props => {
        if (auth === true) {
            return <Component {...props} />;
        } else if (requesting === true) {
            return <LinearProgress />;
        } else {
            return <Redirect to={{ pathname: "/login" }} />;
        }
    };

    return <Route {...rest} render={render} />;
};

const mapStateToProps = store => {
    return {
        auth: getAuthState(store),
        requesting: getAuthRequesting(store)
    };
};

export default connect(
    mapStateToProps,
    {}
)(PrivateRoute);
