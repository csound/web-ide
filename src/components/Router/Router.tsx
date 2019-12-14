import React, { Component, useEffect } from "react";
import { connect, Provider, useDispatch } from "react-redux";
import { ITheme } from "../../db/interfaces";
import { IStore } from "../../db/interfaces";
// import Editor from "../Editor/Editor";
import Home from "../Home/Home";
// import Manual from "../Manual/Manual";
import CsoundManual from "csound-manual-react";
import Profile from "../Profile/Profile";
import Page404 from "../Page404/Page404";
import ProjectContext from "../Projects/ProjectContext";
import { Route, Switch } from "react-router-dom";
import { ConnectedRouter } from "connected-react-router";
import { store } from "../../store";
// import PrivateRoute from "./PrivateRoute";
import { History } from "history";
import { layoutStylesHook } from "./styles";
import { setMenuBarHotKeys } from "../HotKeys/actions";
import { stopCsound } from "../Csound/actions";
import SiteDocs from "../SiteDocs/SiteDocs";

interface IRouterComponent {
    isAuthenticated: boolean;
    history: History;
    theme: ITheme;
}

const EditorLayout = (props: any) => {
    const classes = layoutStylesHook(props.theme);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setMenuBarHotKeys());
        return () => {
            dispatch(stopCsound());
        };
        // eslint-disable-next-line
    }, []);

    return (
        <Provider store={store}>
            <ProjectContext
                className={classes.content}
                {...props}
            ></ProjectContext>
        </Provider>
    );
};

class RouterComponent extends Component<IRouterComponent, any> {
    public render() {
        return (
            <ConnectedRouter history={this.props.history} {...this.props}>
                <Switch>
                    <Route
                        path="/editor/:id?"
                        render={matchProps => <EditorLayout {...matchProps} />}
                    />
                    <Route path="/manual/" render={() => <CsoundManual />} />
                    <Route path="/manual/:id" render={() => <CsoundManual />} />
                    <Route path="/profile/:username?" component={Profile} />
                    <Route
                        path="/"
                        exact
                        render={matchProps => <Home {...matchProps} />}
                    />
                    <Route path="/documentation" render={() => <SiteDocs />} />
                    <Route path="/404" exact component={Page404} />
                    <Route component={Page404} />
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
