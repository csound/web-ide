import { beforeEach, expect, it, vi } from "vitest";
import { updateDoc, writeBatch } from "firebase/firestore";
import { store } from "../../store";
import { saveAllFiles, saveFile } from "../projects/actions";
import {
    closePanel,
    splitActivePanel,
    tabClose,
    tabDockInit,
    tabSwitch
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

it("omits temporary buffers from restored layouts, including split panes", async () => {
    const uid = open();
    store.dispatch(splitActivePanel("right"));
    const layout = persistentWorkspace(state());
    expect(JSON.stringify(layout)).not.toContain(uid);
    expect(JSON.stringify(layout)).not.toContain("example source");
    localStorage.setItem(
        `${project.projectUid}:workspaceLayout`,
        JSON.stringify(layout)
    );
    await store.dispatch(tabDockInit(project.projectUid, [file], undefined));
    expect(temporaryDocumentUids(state().root)).toEqual([]);
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
