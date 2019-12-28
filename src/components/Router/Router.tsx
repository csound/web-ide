import React, { Component, useEffect } from "react";
import { connect, Provider, useDispatch } from "react-redux";
import { IStore } from "@store/types";
import Home from "../Home/Home";
import CsoundManual from "csound-manual-react";
import Profile from "../Profile/Profile";
import Page404 from "../Page404/Page404";
import ProjectContext from "../Projects/ProjectContext";
import { Route, Switch } from "react-router-dom";
import { ConnectedRouter } from "connected-react-router";
import { store } from "../../store";
import { History } from "history";
import { setMenuBarHotKeys } from "../HotKeys/actions";
import { stopCsound } from "../Csound/actions";
import SiteDocs from "../SiteDocs/SiteDocs";

interface IRouterComponent {
    isAuthenticated: boolean;
    history: History;
}

const EditorLayout = (props: any) => {
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
            <ProjectContext {...props}></ProjectContext>
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
        history: ownProp.history
    };
};

export default connect(
    mapStateToProps,
    {}
)(RouterComponent);
