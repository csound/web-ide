import React, { useEffect, useState } from "react";
import { Provider, useDispatch } from "react-redux";
import { useTheme } from "@emotion/react";
import { CodeMirrorPainter } from "@styles/code-mirror-painter";
import ReactTooltip from "react-tooltip";
import Home from "../home/home";
import CsoundManual from "csound-manual-react";
import Profile from "../profile/profile";
import Page404 from "../page-404/page-404";
import ProjectContext from "../projects/project-context";
import { closeTabDock } from "@comp/project-editor/actions";

import { closeProject } from "@comp/projects/actions";
import { Route, Routes } from "react-router-dom";
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
    ReactTooltip.rebuild();
    return (
        <ConnectedRouter history={history}>
            <Routes>
                <Route path="/editor/:id?" element={<EditorLayout />} />
                <Route
                    path="/manual/:id?"
                    element={<CsoundManualWithStyleOverrides theme={theme} />}
                />
                <Route path="/profile/:username?" element={<Profile />} />
                <Route path="/" element={<Home />} />
                <Route path="/documentation" element={<SiteDocuments />} />
                <Route path="/404" element={<Page404 />} />
                <Route element={<Page404 />} />
            </Routes>
        </ConnectedRouter>
    );
};

export default RouterComponent;
