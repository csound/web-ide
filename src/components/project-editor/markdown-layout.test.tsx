import { afterEach, expect, it, vi } from "vitest";
import {
    act,
    cleanup,
    fireEvent,
    render,
    screen
} from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import theme from "../../styles/_theme-dracula";
import { reducer } from "../../store/root-reducer";
import {
    STORE_PROJECT_LOCALLY,
    type IDocument,
    type IProject
} from "../projects/types";
import ProjectEditor from "./project-editor";
import ProjectEditorReducer from "./reducer";
import { TAB_DOCK_INIT } from "./types";
import {
    closePanel,
    lookupManualString,
    movePanel,
    openSidebarTab,
    toggleMaximizePanel
} from "./actions";
import { consoleReadline, type ReadlineEvent } from "../console/readline";

// Keep the real workspace, tabs, controls, and reducer; replace cloud listeners
// and the text editor so this test isolates mode selection across remounts.
vi.mock("../../store", async () => {
    const { useDispatch, useSelector } = await import("react-redux");
    const { createAsyncThunk } = await import("@reduxjs/toolkit");
    return { useDispatch, useSelector, createAsyncThunk };
});
vi.mock("../projects/subscribers", () => ({
    subscribeToProjectChanges: () => () => {}
}));
vi.mock("../project-last-modified/subscribers", () => ({
    subscribeToProjectLastModified: async () => () => {}
}));
vi.mock("../profile/subscribers", () => ({
    subscribeToProfile: () => () => {},
    subscribeToProjectsCount: () => () => {}
}));
vi.mock("../hot-keys/actions", () => ({
    storeEditorKeyboardCallbacks: () => {},
    storeProjectEditorKeyboardCallbacks: () => {}
}));
vi.mock("../console/context", () => ({
    useSetConsole: () => undefined,
    useConsole: () => []
}));
vi.mock("../editor/text-editor", () => ({
    default: ({ documentUid, mode }: { documentUid: string; mode: string }) => (
        <div data-testid={documentUid} data-mode={mode} />
    )
}));

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

function renderWorkspace({ readme = false, owner = false } = {}) {
    vi.stubGlobal(
        "ResizeObserver",
        class {
            observe() {}
            unobserve() {}
            disconnect() {}
        }
    );
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const document = (documentUid: string): IDocument => ({
        documentUid,
        filename:
            readme && documentUid === "notes"
                ? "README.md"
                : `${documentUid}.md`,
        type: "txt",
        currentValue: "# Notes",
        savedValue: "# Notes",
        userUid: "fixture-author",
        isModifiedLocally: false,
        path: [],
        created: undefined,
        lastModified: undefined
    });
    const project: IProject = {
        projectUid: "fixture-project",
        userUid: "fixture-author",
        name: "Fixture",
        description: "",
        isPublic: true,
        tags: [],
        stars: {},
        documents: { notes: document("notes"), other: document("other") }
    };
    const layout = ProjectEditorReducer(ProjectEditorReducer(undefined, {}), {
        type: TAB_DOCK_INIT,
        projectUid: project.projectUid,
        initialOpenDocuments: [{ uid: "notes" }, { uid: "other" }],
        initialIndex: readme ? 1 : 0
    });
    const store = configureStore({
        reducer,
        preloadedState: {
            ProjectEditorReducer: {
                ...layout,
                leftSidebar: null,
                bottomSidebar: null
            }
        }
    });
    store.dispatch({ type: STORE_PROJECT_LOCALLY, projects: [project] });
    if (readme) {
        store.dispatch({
            type: "PROJECTS.ACTIVATE_PROJECT",
            projectUid: project.projectUid
        });
        store.dispatch({ type: "LOGIN.SET_REQUESTING_STATUS", status: false });
        if (owner)
            store.dispatch({
                type: "LOGIN.SIGNIN_SUCCESS",
                user: { uid: project.userUid }
            });
    }
    const workspace = (activeProject: IProject) => (
        <Provider store={store}>
            <MemoryRouter>
                <ThemeProvider
                    theme={createTheme({
                        ...theme,
                        font: { regular: "sans-serif", monospace: "monospace" }
                    })}
                >
                    <ProjectEditor activeProject={activeProject} />
                </ThemeProvider>
            </MemoryRouter>
        </Provider>
    );
    const { rerender } = render(workspace(project));

    return {
        store,
        navigate: (projectUid: string) => {
            const next = { ...project, projectUid };
            act(() => {
                store.dispatch({
                    type: STORE_PROJECT_LOCALLY,
                    projects: [next]
                });
            });
            rerender(workspace(next));
        }
    };
}

it("keeps each Markdown tab's mode when panels split, move, maximize, and close", () => {
    const { store } = renderWorkspace();
    const mode = (id: string) =>
        screen.getByTestId(id).getAttribute("data-mode");
    expect(mode("notes")).toBe("preview");
    fireEvent.click(screen.getByRole("button", { name: "Edit Markdown" }));
    expect(mode("notes")).toBe("edit");

    fireEvent.click(screen.getByRole("button", { name: "Split editor right" }));
    expect(mode("notes")).toBe("edit");
    expect(mode("other")).toBe("preview");
    const root = store.getState().ProjectEditorReducer.root;
    expect(root.kind).toBe("split");
    if (root.kind !== "split") throw new Error("Expected a split workspace");
    const notesPanel = root.second.id;
    const otherPanel = root.first.id;

    act(() => {
        store.dispatch(movePanel(notesPanel, "left"));
    });
    expect(mode("notes")).toBe("edit");
    expect(mode("other")).toBe("preview");

    act(() => {
        store.dispatch(toggleMaximizePanel(notesPanel));
    });
    expect(mode("notes")).toBe("edit");
    act(() => {
        store.dispatch(toggleMaximizePanel(notesPanel));
    });
    expect(mode("notes")).toBe("edit");

    act(() => {
        store.dispatch(closePanel(otherPanel));
    });
    expect(store.getState().ProjectEditorReducer.root.kind).toBe("panel");
    expect(mode("notes")).toBe("edit");
});

it("opens the requesting project's console and hides its input after navigation", () => {
    const { store, navigate } = renderWorkspace();
    let listener!: (event: ReadlineEvent) => void;
    const disconnect = consoleReadline.connect(
        {
            on: (_name, cb) => {
                listener = cb;
            },
            off: vi.fn(),
            readlineSubmit: vi.fn(async () => 0)
        },
        "fixture-project",
        vi.fn()
    );
    try {
        expect(store.getState().ProjectEditorReducer.bottomSidebar).toBeNull();
        act(() => listener({ requestId: 1, prompt: "Name> " }));
        expect(
            store.getState().ProjectEditorReducer.bottomSidebar?.tabs
        ).toEqual([expect.objectContaining({ type: "console" })]);
        expect(screen.getByRole("textbox", { name: "Name>" })).toBe(
            document.activeElement
        );
        fireEvent.change(screen.getByRole("textbox", { name: "Name>" }), {
            target: { value: "My answer" }
        });
        navigate("other-project");
        act(() => store.dispatch(openSidebarTab("bottom", "console")));
        expect(screen.getByTestId("sidebar-bottom-panel")).toBeDefined();
        expect(screen.queryByRole("textbox", { name: "Name>" })).toBeNull();
        navigate("fixture-project");
        expect(
            (
                screen.getByRole("textbox", {
                    name: "Name>"
                }) as HTMLTextAreaElement
            ).value
        ).toBe("My answer");
    } finally {
        act(() => disconnect());
    }
});

it("shows the manual for each mobile lookup and lets the user return to editing", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("iPhone");
    const { store } = renderWorkspace();
    expect(screen.getByTestId("notes")).toBeTruthy();
    act(() => store.dispatch(lookupManualString("oscili")));
    expect(screen.getByTitle("Csound reference manual")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByTestId("notes")).toBeTruthy();
    act(() => store.dispatch(lookupManualString("oscili")));
    expect(screen.getByTitle("Csound reference manual")).toBeTruthy();
});

it.each([false, true])(
    "applies the README landing rule in the editor (owner: %s)",
    (owner) => {
        const { store } = renderWorkspace({ readme: true, owner });
        const dock = store.getState().ProjectEditorReducer.tabDock;
        const uid = owner ? "other" : "notes";
        expect(dock.openDocuments[dock.tabIndex].uid).toBe(uid);
        expect(dock.openDocuments.map((tab) => tab.uid)).toEqual([
            "notes",
            "other"
        ]);
        expect(screen.getByTestId(uid).getAttribute("data-mode")).toBe(
            "preview"
        );
    }
);
