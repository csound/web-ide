import React, { useEffect } from "react";
import { Provider, useDispatch } from "react-redux";
import { useTheme } from "emotion-theming";
import { CodeMirrorPainter } from "@styles/CodeMirrorPainter";
import Home from "../Home/Home";
import CsoundManual from "csound-manual-react";
import Profile from "../Profile/Profile";
import Page404 from "../Page404/Page404";
import ProjectContext from "../Projects/ProjectContext";
import { Route, Switch } from "react-router-dom";
import { ConnectedRouter } from "connected-react-router";
import { store } from "../../store";
import { History } from "history";
import { stopCsound } from "../Csound/actions";
import SiteDocs from "../SiteDocs/SiteDocs";

interface IRouterComponent {
    isAuthenticated: boolean;
    history: History;
}

const EditorLayout = (props: any) => {
    const dispatch = useDispatch();

    useEffect(() => {
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

const RouterComponent = (props: any) => {
    const theme = useTheme();
    return (
        <ConnectedRouter history={props.history} {...props}>
            <Switch>
                <Route
                    path="/editor/:id?"
                    render={matchProps => <EditorLayout {...matchProps} />}
                />
                <Route
                    path="/manual/"
                    render={() => (
                        <CsoundManual
                            theme={theme}
                            codeMirrorPainter={CodeMirrorPainter}
                        />
                    )}
                />
                <Route
                    path="/manual/:id"
                    render={() => (
                        <CsoundManual
                            theme={theme}
                            codeMirrorPainter={CodeMirrorPainter}
                        />
                    )}
                />
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
};

export default RouterComponent;
