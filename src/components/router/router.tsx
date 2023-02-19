import React, { useEffect } from "react";
import { useDispatch, history, store } from "@root/store";
import { Provider } from "react-redux";
import Home from "../home/home";
import CsoundManual from "@comp/manual/manual";
import { Profile } from "../profile/profile";
import { Page404 } from "../page-404/page-404";
import ProjectContext from "../projects/project-context";
import { closeTabDock } from "@comp/project-editor/actions";
import { closeProject } from "@comp/projects/actions";
import { HistoryRouter as Router } from "redux-first-history/rr6";
import { Route, Routes } from "react-router-dom";
import { stopCsound } from "../csound/actions";
import { SiteDocuments } from "../site-documents/site-documents";
import { ConsoleProvider } from "@comp/console/context";
import { ParserDebugger } from "@comp/editor/modes/csound/debug-parser";

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
            <ConsoleProvider>
                <ProjectContext {...properties}></ProjectContext>
            </ConsoleProvider>
        </Provider>
    );
};

// const CsoundManualWithStyleOverrides = ({
//     theme,
//     ...routerProperties
// }: any) => {
//     const [isMounted, setIsMounted] = useState(false);
//     const [{ fetched, Csound }, setFetchState]: [
//         { fetched: boolean; Csound: any },
//         any
//     ] = useState({ fetched: false, Csound: undefined });

//     useEffect(() => {
//         if (!isMounted) {
//             setIsMounted(true);
//             import("@csound/browser").then(({ Csound }) => {
//                 setFetchState({ fetched: true, Csound });
//             });
//         }
//     }, [isMounted, setIsMounted, fetched, Csound, setFetchState]);

//     return !fetched ? (
//         <></>
//     ) : (
//         <CsoundManual
//             {...routerProperties}
//             theme={theme}
//             codeMirrorPainter={CodeMirrorPainter}
//             Csound={Csound}
//         />
//     );
// };

const RouterComponent = (): React.ReactElement => {
    return (
        <>
            <Router history={history}>
                <Routes>
                    <Route index element={<Home />} />
                    <Route path="profile/:username" element={<Profile />} />
                    <Route path="profile/:username/*" element={<Profile />} />
                    <Route path="editor" element={<EditorLayout />}>
                        <Route path=":id" element={<EditorLayout />} />
                    </Route>
                    <Route path="manual" element={<CsoundManual />}>
                        <Route path=":id" element={<CsoundManual />} />
                    </Route>

                    <Route path="documentation" element={<SiteDocuments />} />
                    <Route path="404" element={<Page404 />} />
                    <Route
                        path="parser-debugger"
                        element={<ParserDebugger />}
                    />
                    <Route path="*" element={<Page404 />} />
                </Routes>
            </Router>
        </>
    );
};

export default RouterComponent;
