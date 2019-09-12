import React, { Component } from "react";
import { connect, Provider } from "react-redux";
import { ITheme } from "../../db/interfaces";
import { IStore } from "../../db/interfaces";
// import Editor from "../Editor/Editor";
import Header from "../Header/Header";
import Home from "../Home/Home";
// import Manual from "../Manual/Manual";
import CsoundManual from "csound-manual-react";
import Profile from "../Profile/Profile";
import ProjectContext from "../Projects/ProjectContext";
import { Route, Switch } from "react-router-dom";
import { ConnectedRouter } from "connected-react-router";
import { store } from "../../store";
// import PrivateRoute from "./PrivateRoute";
import { History } from "history";
import { layoutStylesHook } from "./styles";
import ProjectEditor from "../ProjectEditor/ProjectEditor";

interface IRouterComponent {
    isAuthenticated: boolean;
    history: History;
    theme: ITheme;
}

const EditorLayout = (args: any) => {
    const classes = layoutStylesHook(args.theme);
    const { match } = args;

    const renderMeth = matchProps => {
        const { to, staticContext, ...rest } = matchProps;
        return (
            <div>
                <Header />
                <ProjectContext className={classes.content} {...rest}>
                    <ProjectEditor projectId={match.params.id} />
                </ProjectContext>
            </div>
        );
    };

    return (
        <Provider store={store}>
            <Route render={renderMeth} />
        </Provider>
    );
};

class RouterComponent extends Component<IRouterComponent, any> {
    // public componentDidMount() {}

    public render() {
        console.log(CsoundManual);
        return (
            <ConnectedRouter history={this.props.history} {...this.props}>
                <Switch>
                    <Route
                        path="/editor/:id?"
                        render={matchProps => <EditorLayout {...matchProps} />}
                    />
                    <Route path="/manual/:id" render={() => <CsoundManual />} />
                    <Profile path="/profile/:username?" {...this.props} />
                    <Route
                        path="/"
                        render={matchProps => <Home {...matchProps} />}
                    />
                </Switch>
            </ConnectedRouter>
        );
    }
}

const mapStateToProps = (store: IStore, ownProp: any): IRouterComponent => {
    return {
        isAuthenticated: store.LoginReducer.authenticated,
        history: ownProp.history,
        theme: store.theme
    };
};

export default connect(
    mapStateToProps,
    {}
)(RouterComponent);
