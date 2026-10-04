// The browser test blocks cloud traffic and replaces only the fork API and listeners.
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { store } from "../../src/store";
import ThemeProvider from "../../src/styles/theme-provider";
import { Header } from "../../src/components/header/header";
import GlobalModal from "../../src/components/modal";
import ProjectEditor from "../../src/components/project-editor/project-editor";
import { ConsoleProvider } from "../../src/components/console/context";
import { tabDockInit } from "../../src/components/project-editor/actions";
import { SIGNIN_SUCCESS } from "../../src/components/login/types";
import type { IProject } from "../../src/components/projects/types";

const project: IProject = {
    projectUid: "fork-fixture",
    userUid: "fixture-author",
    name: "Granular tides",
    description: "A slow pulse made from grains of a field recording.",
    isPublic: true,
    iconName: "default",
    iconForegroundColor: "#ffffff",
    iconBackgroundColor: "#276b64",
    forkedFrom: "source-fixture",
    forkedAt: 1700000000000,
    tags: [],
    stars: {},
    documents: {
        code: {
            documentUid: "code",
            filename: "project.csd",
            type: "txt",
            path: [],
            currentValue:
                "; Granular tides\n; Try a slower grain rate.\n\ninstr 1\n  aTone oscili 0.2, 220\n  outs aTone, aTone\nendin",
            savedValue: "",
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

createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
        <MemoryRouter initialEntries={[`/editor/${project.projectUid}`]}>
            <ThemeProvider>
                <ConsoleProvider>
                    <Header />
                    <div
                        style={{
                            paddingTop: 56,
                            height: "100%",
                            boxSizing: "border-box"
                        }}
                    >
                        <ProjectEditor activeProject={project} />
                    </div>
                    <GlobalModal />
                </ConsoleProvider>
            </ThemeProvider>
        </MemoryRouter>
    </Provider>
);
