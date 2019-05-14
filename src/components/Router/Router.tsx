import React, { Component } from "react";
// import Login from "../containers/Login/Login";
import Editor from "../Editor/Editor";
import { Route, Switch } from 'react-router-dom';
import { ConnectedRouter } from "connected-react-router";
import PrivateRoute from "./PrivateRoute";
import { connect } from "react-redux";
import { History } from "history";
import { layoutStylesHook } from "./styles";

interface IRouterComponent {
    history: History;
}

// Routes needing Hedaer/Footer should be wrapped with this
const DefaultLayout = (args: any) => {
    const { component, ...rest } = (args as any);
    const WrappedComponent: any = args.component;
    const classes = layoutStylesHook();
    return (
        <Route {...rest} render={matchProps => (
            <main className={classes.content}>
                <WrappedComponent {...matchProps} />
            </main>
        )} />
    )
};

class RouterComponent extends Component<IRouterComponent, any> {

    public componentDidMount() {}

    public render() {
        return (
            <ConnectedRouter history={this.props.history} {...this.props}>
                <Switch>
                    <DefaultLayout {...this.props} path="/" component={Editor} />
                    <PrivateRoute
                        {...this.props}
                        path="/dashboard"
                        component={Editor}
                    />
                </Switch>
            </ConnectedRouter>
        );
    }
}

export default connect( null, {})(RouterComponent);
