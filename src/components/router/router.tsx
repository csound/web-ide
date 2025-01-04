import Home from "../home/home";
import CsoundManual from "@comp/manual/manual";
import { Profile } from "../profile/profile";
import { Page404 } from "../page-404/page-404";
import { ProjectContext } from "../projects/project-context";
import { BrowserRouter, Route, Routes } from "react-router";
import { SiteDocuments } from "../site-documents/site-documents";

export const WebIdeRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route index element={<Home />} />
                <Route path="profile/:username/:tab?" element={<Profile />} />
                <Route path="editor" element={<ProjectContext />}>
                    <Route path=":id" element={<ProjectContext />} />
                </Route>
                <Route path="manual" element={<CsoundManual />}>
                    <Route path=":id" element={<CsoundManual />} />
                </Route>

                <Route path="documentation" element={<SiteDocuments />} />
                <Route path="404" element={<Page404 />} />
                <Route path="*" element={<Page404 />} />
            </Routes>
        </BrowserRouter>
    );
};
