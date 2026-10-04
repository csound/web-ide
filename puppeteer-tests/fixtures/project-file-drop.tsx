// The browser test replaces cloud listeners and upload writes.
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { store, useSelector } from "../../src/store";
import ThemeProvider from "../../src/styles/theme-provider";
import ProjectEditor from "../../src/components/project-editor/project-editor";
import { ConsoleProvider } from "../../src/components/console/context";
import {
    tabDockInit,
    lookupManualString
} from "../../src/components/project-editor/actions";
import { SIGNIN_SUCCESS } from "../../src/components/login/types";
import type { IProject } from "../../src/components/projects/types";
const project: IProject = {
    projectUid: "file-drop-fixture",
    userUid: "fixture-author",
    name: "Sound study",
    description: "",
    isPublic: false,
    tags: [],
    stars: {},
    documents: {
        saved: {
            documentUid: "saved",
            filename: "project.csd",
            type: "txt",
            path: [],
            currentValue: "; Original project file",
            savedValue: "; Original project file",
            isModifiedLocally: false,
            userUid: "fixture-author",
            created: undefined,
            lastModified: undefined
        }
    }
};
store.dispatch({ type: SIGNIN_SUCCESS, user: { uid: "fixture-author" } });
store.dispatch({ type: "PROJECTS.STORE_PROJECT_LOCALLY", projects: [project] });
store.dispatch({
    type: "PROJECTS.ACTIVATE_PROJECT",
    projectUid: project.projectUid
});
await store.dispatch(
    tabDockInit(project.projectUid, Object.values(project.documents), undefined)
);
function Editor() {
    const active = useSelector(
        (state) => state.ProjectsReducer.projects[project.projectUid]
    );
    return <ProjectEditor activeProject={active} />;
}
(window as any).fileDropFixture = {
    state: () => store.getState(),
    manual: () => store.dispatch(lookupManualString("oscili"))
};
createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
        <MemoryRouter>
            <ThemeProvider>
                <ConsoleProvider>
                    <header style={{ padding: 12 }}>Sound study</header>
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <Editor />
                    </div>
                </ConsoleProvider>
            </ThemeProvider>
        </MemoryRouter>
    </Provider>
);
