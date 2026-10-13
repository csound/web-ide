import Home from "../home/home";
import { Profile } from "../profile/profile";
import { Page404 } from "../page-404/page-404";
import { ProjectContext } from "../projects/project-context";
import { BrowserRouter, Route, Routes } from "react-router";
import { lazy, Suspense } from "react";

const SiteDocuments = lazy(() =>
    import("../site-documents/site-documents").then((module) => ({
        default: module.SiteDocuments
    }))
);

export const WebIdeRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route index element={<Home />} />
                <Route path="profile/:username/:tab?" element={<Profile />} />
                <Route path="editor" element={<ProjectContext />}>
                    <Route path=":id" element={<ProjectContext />} />
                </Route>
                <Route
                    path="documentation/*"
                    element={
                        <Suspense
                            fallback={<p role="status">Loading guide...</p>}
                        >
                            <SiteDocuments />
                        </Suspense>
                    }
                />
                <Route path="404" element={<Page404 />} />
                <Route path="*" element={<Page404 />} />
            </Routes>
        </BrowserRouter>
    );
};
