import React, { Component, useEffect } from "react";
import { connect, Provider, useDispatch } from "react-redux";
import { ITheme } from "../../db/interfaces";
import { IStore } from "../../db/interfaces";
// import Editor from "../Editor/Editor";
import Header from "../Header/Header";
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
import ProjectEditor from "../ProjectEditor/ProjectEditor";
import { setMenuBarHotKeys } from "../HotKeys/actions";
import { stopCsound } from "../Csound/actions";
import SiteDocs from "../SiteDocs/SiteDocs";
interface IRouterComponent {
    isAuthenticated: boolean;
    history: History;
    theme: ITheme;
}

const EditorLayout = (args: any) => {
    const classes = layoutStylesHook(args.theme);
    const dispatch = useDispatch();
    const { match } = args;

    useEffect(() => {
        dispatch(setMenuBarHotKeys());
        return () => {
            dispatch(stopCsound());
        };
    }, [dispatch]);

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
        return (
            <ConnectedRouter history={this.props.history} {...this.props}>
                <Switch>
                    <Route
                        path="/editor/:id?"
                        component={EditorLayout}
                        // render={matchProps => <EditorLayout {...matchProps} />}
                    />
                    <Route path="/manual/" render={() => <CsoundManual />} />
                    <Route path="/manual/:id" render={() => <CsoundManual />} />
                    <Route path="/profile/:username?" component={Profile} />
                    <Route
                        path="/"
                        exact
                        render={matchProps => <Home {...matchProps} />}
                    />
                    <Route
                        path="/documentation"
                        render={() => <SiteDocs />}
                    />
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

export default connect(mapStateToProps, {})(RouterComponent);
