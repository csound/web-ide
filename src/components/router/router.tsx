import React, { useEffect, useState } from "react";
import { Provider as Provider_, useDispatch } from "react-redux";
import { useTheme } from "@emotion/react";
import { CodeMirrorPainter } from "@styles/code-mirror-painter";
import ReactTooltip from "react-tooltip";
import Home from "../home/home";
import CsoundManual from "csound-manual-react";
import Profile from "../profile/profile";
import Page404 from "../page-404/page-404";
import ProjectContext from "../projects/project-context";
import { closeTabDock } from "@comp/project-editor/actions";
import { history, store } from "@store";
import { closeProject } from "@comp/projects/actions";
import { HistoryRouter as Router } from "redux-first-history/rr6";
import { Route, Routes } from "react-router-dom";
import { stopCsound } from "../csound/actions";
import SiteDocuments from "../site-documents/site-documents";

const Provider = Provider_ as any;

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
        <Router history={history}>
            <Routes>
                <Route index element={<Home />} />
                <Route path="profile/:username" element={<Profile />} />
                <Route path="profile/:username/*" element={<Profile />} />
                <Route path="editor" element={<EditorLayout />}>
                    <Route path=":id" element={<EditorLayout />} />
                </Route>
                <Route
                    path="manual"
                    element={<CsoundManualWithStyleOverrides theme={theme} />}
                >
                    <Route
                        path=":id"
                        element={
                            <CsoundManualWithStyleOverrides theme={theme} />
                        }
                    />
                </Route>

                <Route path="documentation" element={<SiteDocuments />} />
                <Route path="404" element={<Page404 />} />
                <Route path="*" element={<Page404 />} />
            </Routes>
        </Router>
    );
};

export default RouterComponent;
