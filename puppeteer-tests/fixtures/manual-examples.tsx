// This fixture uses a local project. The browser test replaces cloud listeners.
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { store } from "../../src/store";
import ThemeProvider from "../../src/styles/theme-provider";
import ProjectEditor from "../../src/components/project-editor/project-editor";
import { ConsoleProvider } from "../../src/components/console/context";
import {
    tabDockInit,
    lookupManualString
} from "../../src/components/project-editor/actions";
import { saveFile, saveAllFiles } from "../../src/components/projects/actions";
import { SIGNIN_SUCCESS } from "../../src/components/login/types";
import { openEditors } from "../../src/components/editor/editor";
import type { IProject } from "../../src/components/projects/types";

const project: IProject = {
    projectUid: "manual-example-fixture",
    userUid: "fixture-author",
    name: "Manual workspace",
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
store.dispatch(lookupManualString("oscili"));
(window as any).manualExampleFixture = {
    state: () => store.getState(),
    lookup: (opcode: string) => store.dispatch(lookupManualString(opcode)),
    edit: () => {
        const dock = store.getState().ProjectEditorReducer.tabDock;
        const view = openEditors.get(dock.openDocuments[dock.tabIndex].uid)!;
        view.dispatch({
            changes: {
                from: view.state.doc.length,
                insert: "\n; temporary edit"
            }
        });
    }
};
createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
        <MemoryRouter>
            <ThemeProvider>
                <ConsoleProvider>
                    <div
                        style={{
                            height: "100%",
                            display: "flex",
                            flexDirection: "column"
                        }}
                    >
                        <div>
                            <button
                                onClick={() => void store.dispatch(saveFile())}
                            >
                                Save fixture
                            </button>
                            <button
                                onClick={() =>
                                    void store.dispatch(saveAllFiles())
                                }
                            >
                                Save all fixture
                            </button>
                        </div>
                        <div style={{ flex: 1, minHeight: 0 }}>
                            <ProjectEditor activeProject={project} />
                        </div>
                    </div>
                </ConsoleProvider>
            </ThemeProvider>
        </MemoryRouter>
    </Provider>
);
