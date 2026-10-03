import { beforeEach, expect, it, vi } from "vitest";
import { updateDoc, writeBatch } from "firebase/firestore";
import { store } from "../../store";
import { saveAllFiles, saveFile } from "../projects/actions";
import {
    closePanel,
    splitActivePanel,
    tabClose,
    tabDockInit,
    tabSwitch,
    toggleMaximizePanel
} from "./actions";
import {
    openTemporaryDocument,
    persistentWorkspace,
    temporaryDocumentUids,
    updateTemporaryDocument
} from "./temporary-documents";
import type { IDocument, IProject } from "../projects/types";

vi.mock("firebase/firestore", async (original) => ({
    ...(await original<typeof import("firebase/firestore")>()),
    updateDoc: vi.fn(),
    writeBatch: vi.fn()
}));

const file: IDocument = {
    documentUid: "saved",
    filename: "project.csd",
    type: "txt",
    currentValue: "saved source",
    savedValue: "saved source",
    isModifiedLocally: false,
    path: [],
    userUid: "author",
    created: undefined,
    lastModified: undefined
};
const project: IProject = {
    projectUid: "temporary-test",
    userUid: "author",
    name: "Project",
    description: "",
    isPublic: true,
    tags: [],
    stars: {},
    documents: { saved: file }
};
const state = () => store.getState().ProjectEditorReducer;
function open() {
    const action = openTemporaryDocument({
        filename: "project.csd",
        value: "example source"
    });
    store.dispatch(action);
    return action.documentUid;
}
beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    store.dispatch({ type: "PROJECT_EDITOR.TAB_DOCK_CLOSE" });
    store.dispatch({
        type: "PROJECTS.STORE_PROJECT_LOCALLY",
        projects: [project]
    });
    store.dispatch({
        type: "PROJECTS.ACTIVATE_PROJECT",
        projectUid: project.projectUid
    });
    await store.dispatch(tabDockInit(project.projectUid, [file], undefined));
});

it("keeps edited temporary buffers out of Save, Save All and project files", async () => {
    const uid = open();
    store.dispatch(updateTemporaryDocument(uid, "edited example"));
    expect(state().tabDock.openDocuments.at(-1)?.temporary?.value).toBe(
        "edited example"
    );
    await store.dispatch(saveFile());
    await store.dispatch(saveAllFiles());
    expect(updateDoc).not.toHaveBeenCalled();
    expect(writeBatch).not.toHaveBeenCalled();
    expect(
        store.getState().ProjectsReducer.projects[project.projectUid].documents
    ).toEqual({ saved: file });
});

it("retains edits when switching tabs and discards without a save prompt", () => {
    const uid = open();
    store.dispatch(updateTemporaryDocument(uid, "edited example"));
    store.dispatch(tabSwitch(0));
    store.dispatch(tabSwitch(1));
    expect(state().tabDock.openDocuments[1].temporary?.value).toBe(
        "edited example"
    );
    store.dispatch(tabClose(project.projectUid, uid, false));
    expect(state().tabDock.openDocuments.map((tab) => tab.uid)).toEqual([
        "saved"
    ]);
    expect(store.getState().ModalReducer.isOpen).toBe(false);
    expect(JSON.stringify(state())).not.toContain("edited example");
    expect(localStorage.getItem(`${project.projectUid}:tabOrder`)).toBe(
        '["saved"]'
    );
});

it("prunes temporary-only panes before saving and does not restore duplicate project tabs", async () => {
    const savedPanel = state().root;
    const uid = open();
    store.dispatch(splitActivePanel("right"));
    store.dispatch(toggleMaximizePanel(state().activePanelId));
    const layout = persistentWorkspace(state());
    expect(JSON.stringify(layout)).not.toContain(uid);
    expect(JSON.stringify(layout)).not.toContain("example source");
    expect(layout.root).toEqual(savedPanel);
    expect(layout.activePanelId).toBe(savedPanel.id);
    expect(layout.maximizedPanelId).toBeNull();
    localStorage.setItem(
        `${project.projectUid}:workspaceLayout`,
        JSON.stringify(layout)
    );
    store.dispatch({ type: "PROJECT_EDITOR.TAB_DOCK_CLOSE" });
    await store.dispatch(tabDockInit(project.projectUid, [file], undefined));
    expect(state().root).toEqual(savedPanel);
    expect(state().tabDock.openDocuments.map((tab) => tab.uid)).toEqual([
        "saved"
    ]);
    expect(temporaryDocumentUids(state().root)).toEqual([]);
});

it("prunes nested panes from old layouts while retaining pane focus and sidebars", async () => {
    store.dispatch(splitActivePanel("right"));
    const savedLayout = persistentWorkspace(state());
    open();
    store.dispatch(splitActivePanel("bottom"));
    open();
    store.dispatch(splitActivePanel("right"));
    store.dispatch(toggleMaximizePanel(savedLayout.activePanelId));
    const oldLayout = state();
    const layout = persistentWorkspace(oldLayout);
    expect(layout).toEqual({
        ...savedLayout,
        maximizedPanelId: savedLayout.activePanelId,
        nextPanelNumber: oldLayout.nextPanelNumber,
        nextSplitNumber: oldLayout.nextSplitNumber,
        nextTabNumber: oldLayout.nextTabNumber
    });
    expect(persistentWorkspace(layout)).toEqual(layout);
    localStorage.setItem(
        `${project.projectUid}:workspaceLayout`,
        JSON.stringify(oldLayout)
    );
    store.dispatch({ type: "PROJECT_EDITOR.TAB_DOCK_CLOSE" });
    await store.dispatch(tabDockInit(project.projectUid, [file], undefined));
    expect(persistentWorkspace(state())).toEqual(layout);
});

it("keeps one empty pane when no saved tabs remain", async () => {
    const firstPanelId = state().root.id;
    store.dispatch(tabClose(project.projectUid, "saved", false));
    open();
    store.dispatch(splitActivePanel("right"));
    store.dispatch(splitActivePanel("bottom"));
    store.dispatch(toggleMaximizePanel(state().activePanelId));
    const layout = persistentWorkspace(state());
    expect(layout.root).toEqual({
        id: firstPanelId,
        kind: "panel",
        tabs: [],
        tabIndex: -1
    });
    expect(layout.activePanelId).toBe(firstPanelId);
    expect(layout.maximizedPanelId).toBeNull();
    localStorage.setItem(
        `${project.projectUid}:workspaceLayout`,
        JSON.stringify(layout)
    );
    store.dispatch({ type: "PROJECT_EDITOR.TAB_DOCK_CLOSE" });
    await store.dispatch(tabDockInit(project.projectUid, [file], undefined));
    expect(state().root.kind).toBe("panel");
    expect(state().tabDock.openDocuments.map((tab) => tab.uid)).toEqual([
        "saved"
    ]);
});

it("does not reopen a retained project tab in a utility pane after pruning", async () => {
    open();
    store.dispatch(splitActivePanel("right"));
    const layout = persistentWorkspace({
        ...state(),
        root: {
            id: "utility-split",
            kind: "split",
            direction: "horizontal",
            first: {
                id: "utility-panel",
                kind: "panel",
                tabs: [{ id: "manual-tab", type: "manual", uid: "manual" }],
                tabIndex: 0
            },
            second: state().root
        }
    });
    localStorage.setItem(
        `${project.projectUid}:workspaceLayout`,
        JSON.stringify(layout)
    );
    store.dispatch({ type: "PROJECT_EDITOR.TAB_DOCK_CLOSE" });
    await store.dispatch(tabDockInit(project.projectUid, [file], undefined));
    expect(state().root).toEqual(layout.root);
});

it("moves a sole temporary tab when splitting and drops its buffer when the pane closes", () => {
    store.dispatch(tabClose(project.projectUid, "saved", false));
    const uid = open();
    store.dispatch(splitActivePanel("right"));
    expect(temporaryDocumentUids(state().root)).toEqual([uid]);
    store.dispatch(closePanel(state().activePanelId));
    expect(temporaryDocumentUids(state().root)).toEqual([]);
});

it("opens independent buffers for repeated examples with the same filename", () => {
    const first = open();
    const second = open();
    expect(first).not.toBe(second);
    store.dispatch(updateTemporaryDocument(first, "first edit"));
    expect(state().tabDock.openDocuments.at(-1)?.temporary?.value).toBe(
        "example source"
    );
});
