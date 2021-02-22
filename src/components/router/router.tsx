import React, { useEffect, useState } from "react";
import { Provider, useDispatch } from "react-redux";
import { useTheme } from "@emotion/react";
import { CodeMirrorPainter } from "@styles/code-mirror-painter";
import Home from "../home/home";
import CsoundManual from "csound-manual-react";
import Profile from "../profile/profile";
import Page404 from "../page-404/page-404";
import ProjectContext from "../projects/project-context";
import { closeTabDock } from "@comp/project-editor/actions";

import { closeProject } from "@comp/projects/actions";
import { Route, Switch } from "react-router-dom";
import { ConnectedRouter } from "connected-react-router";
import { history, store } from "../../store";
// import { History } from "history";
import { stopCsound } from "../csound/actions";
import SiteDocuments from "../site-documents/site-documents";

// interface IRouterComponent {
//     isAuthenticated: boolean;
//     history: History;
// }

const EditorLayout = (properties: any) => {
    const dispatch = useDispatch();

    useEffect(() => {
        return () => {
            dispatch(stopCsound());
            dispatch(closeProject());
            dispatch(closeTabDock());
        };
    }, [dispatch]);

    return (
        <Provider store={store}>
            <ProjectContext {...properties}></ProjectContext>
        </Provider>
    );
};

const CsoundManualWithStyleOverrides = ({
    theme,
    ...routerProperties
}: any) => {
    const [isMounted, setIsMounted] = useState(false);
    const [{ fetched, Csound }, setFetchState]: [
        { fetched: boolean; Csound: any },
        any
    ] = useState({ fetched: false, Csound: undefined });

    useEffect(() => {
        if (!isMounted) {
            setIsMounted(true);
            import("@csound/browser").then(({ Csound }) => {
                setFetchState({ fetched: true, Csound });
            });
        }
    }, [isMounted, setIsMounted, fetched, Csound, setFetchState]);

    return !fetched ? (
        <></>
    ) : (
        <CsoundManual
            {...routerProperties}
            theme={theme}
            codeMirrorPainter={CodeMirrorPainter}
            Csound={Csound}
        />
    );
};

const RouterComponent = (): React.ReactElement => {
    const theme = useTheme();
    return (
        <ConnectedRouter history={history}>
            <Switch>
                <Route
                    path="/editor/:id?"
                    render={(matchProperties) => (
                        <EditorLayout {...matchProperties} />
                    )}
                />
                <Route
                    path="/manual/:id?"
                    render={(routerProperties) => (
                        <CsoundManualWithStyleOverrides
                            theme={theme}
                            {...routerProperties}
                        />
                    )}
                />
                <Route path="/profile/:username?" component={Profile} />
                <Route path="/" component={Home} exact />
                <Route path="/documentation" render={() => <SiteDocuments />} />
                <Route path="/404" exact component={Page404} />
                <Route component={Page404} />
            </Switch>
        </ConnectedRouter>
    );
};

export default RouterComponent;
