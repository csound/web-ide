import { Route, Redirect } from "react-router-dom";
import { ThreeBounce } from "better-react-spinkit";
import React from "react";
// import { getLogin, getUser, getAuth } from "../selectors";
import { connect } from "react-redux";

const PrivateRoute = ({ component: Component, user, auth, login, ...rest }) => {
    const render = props => {
        if (user !== false) {
            return <Component {...props} />;
        } else if (auth.requesting === true || login.requesting === true) {
            return (
                <div style={{ position: "absolute", top: "50%", left: "50%" }}>
                    <ThreeBounce />
                </div>
            );
        } else {
            return <Redirect to={{ pathname: "/login" }} />;
        }
    };

    return <Route {...rest} render={render} />;
};

const mapStateToProps = store => {
    return {
        // user: getUser(store),
        // auth: getAuth(store),
        // login: getLogin(store)
    };
};

export default connect(mapStateToProps, null)(PrivateRoute);
