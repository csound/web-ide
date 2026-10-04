import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import ProjectsReducer from "../projects/reducer";
import { subscribeToProfileProjects } from "./subscribers";
const mocks = vi.hoisted(() => ({
    onSnapshot: vi.fn(),
    getState: vi.fn(),
    convert: vi.fn()
}));
vi.mock("firebase/firestore", () => ({
    query: (...parts: unknown[]) => parts,
    where: (...parts: unknown[]) => parts,
    onSnapshot: mocks.onSnapshot
}));
vi.mock("../../config/firestore", () => ({
    projects: "projects",
    tags: "tags"
}));
vi.mock("../../store", () => ({ store: { getState: mocks.getState } }));
vi.mock("../projects/utils", () => ({
    convertProjectSnapToProject: mocks.convert
}));
vi.mock("../projects/actions", () => ({
    storeProjectLocally: (projects: unknown[]) => ({
        type: "PROJECTS.STORE_PROJECT_LOCALLY",
        projects
    }),
    unsetProject: (projectUid: string) => ({
        type: "PROJECTS.UNSET_PROJECT",
        projectUid
    })
}));
vi.mock("./actions", () => ({}));
const project = {
    projectUid: "cached",
    userUid: "fixture",
    name: "Project",
    tags: [],
    documents: { saved: { currentValue: "unsaved work" } }
};
beforeEach(() => {
    vi.clearAllMocks();
    mocks.convert.mockResolvedValue({ ...project, documents: {} });
    mocks.onSnapshot.mockImplementation(() => vi.fn());
});
afterEach(() => vi.restoreAllMocks());
function setup() {
    const store = configureStore({ reducer: { ProjectsReducer } });
    mocks.getState.mockImplementation(store.getState);
    store.dispatch({
        type: "PROJECTS.STORE_PROJECT_LOCALLY",
        projects: [project]
    });
    const stop = subscribeToProfileProjects("fixture", false, store.dispatch);
    const projects = mocks.onSnapshot.mock.calls[0][1];
    return { store, stop, projects };
}
it("fills tags for cached projects, tracks edits/removals, and keeps open documents", async () => {
    const { store, projects } = setup();
    await projects({ docs: [{ id: "cached" }] });
    const tags = mocks.onSnapshot.mock.calls[1][1];
    tags({ docs: [{ id: "ambient" }] });
    expect(store.getState().ProjectsReducer.projects.cached.tags).toEqual([
        "ambient"
    ]);
    expect(store.getState().ProjectsReducer.projects.cached.documents).toEqual(
        project.documents
    );
    await projects({ docs: [{ id: "cached" }] });
    expect(mocks.onSnapshot).toHaveBeenCalledTimes(2);
    expect(store.getState().ProjectsReducer.projects.cached.tags).toEqual([
        "ambient"
    ]);
    tags({ docs: [] });
    expect(store.getState().ProjectsReducer.projects.cached.tags).toEqual([]);
});
it("drops removed projects and stops their tag listeners", async () => {
    const { store, projects, stop } = setup();
    await projects({ docs: [{ id: "cached" }] });
    const stopTags = mocks.onSnapshot.mock.results[1].value;
    await projects({ docs: [] });
    expect(store.getState().ProjectsReducer.projects.cached).toBeUndefined();
    expect(stopTags).toHaveBeenCalledOnce();
    stop();
    expect(mocks.onSnapshot.mock.results[0].value).toHaveBeenCalledOnce();
});
it("does not reinsert a project after a newer snapshot or unmount", async () => {
    const { store, projects, stop } = setup();
    let finish!: (value: unknown) => void;
    mocks.convert.mockImplementationOnce(
        () =>
            new Promise((resolve) => {
                finish = resolve;
            })
    );
    const pending = projects({ docs: [{ id: "cached" }] });
    await projects({ docs: [] });
    finish(project);
    await pending;
    expect(store.getState().ProjectsReducer.projects.cached).toBeUndefined();
    mocks.convert.mockImplementationOnce(
        () =>
            new Promise((resolve) => {
                finish = resolve;
            })
    );
    const after = projects({ docs: [{ id: "cached" }] });
    stop();
    finish(project);
    await after;
    expect(mocks.onSnapshot).toHaveBeenCalledTimes(1);
});
it("ignores callbacks from a replaced listener and after unmount", async () => {
    const { store, projects, stop } = setup();
    await projects({ docs: [{ id: "cached" }] });
    const oldTags = mocks.onSnapshot.mock.calls[1][1];
    await projects({ docs: [] });
    await projects({ docs: [{ id: "cached" }] });
    const currentTags = mocks.onSnapshot.mock.calls[2][1];
    currentTags({ docs: [{ id: "current" }] });
    oldTags({ docs: [{ id: "old" }] });
    expect(store.getState().ProjectsReducer.projects.cached.tags).toEqual([
        "current"
    ]);
    stop();
    expect(mocks.onSnapshot.mock.results[2].value).toHaveBeenCalledOnce();
    currentTags({ docs: [] });
    await projects({ docs: [] });
    expect(store.getState().ProjectsReducer.projects.cached.tags).toEqual([
        "current"
    ]);
});

it("loads successful projects and watches cached tags when another conversion fails", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const { store, projects } = setup();
    const failure = new Error("Last-modified read failed");
    mocks.convert.mockImplementation(async ({ id }) => {
        if (id !== "new") throw failure;
        return { ...project, projectUid: id, documents: {} };
    });
    await projects({
        docs: [{ id: "cached" }, { id: "new" }, { id: "failed" }]
    });
    expect(store.getState().ProjectsReducer.projects.new).toBeDefined();
    expect(store.getState().ProjectsReducer.projects.failed).toBeUndefined();
    expect(mocks.onSnapshot).toHaveBeenCalledTimes(3);
    mocks.onSnapshot.mock.calls[1][1]({ docs: [{ id: "ambient" }] });
    mocks.onSnapshot.mock.calls[2][1]({ docs: [{ id: "synthesis" }] });
    expect(store.getState().ProjectsReducer.projects.cached.tags).toEqual([
        "ambient"
    ]);
    expect(store.getState().ProjectsReducer.projects.new.tags).toEqual([
        "synthesis"
    ]);
    expect(logged).toHaveBeenCalledTimes(2);
});
it("retries failed tag listeners on the next project snapshot and ignores old errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { store, projects, stop } = setup();
    await projects({ docs: [{ id: "cached" }] });
    const old = mocks.onSnapshot.mock.calls[1];
    old[2](new Error("Listener failed"));
    await projects({ docs: [{ id: "cached" }] });
    expect(mocks.onSnapshot).toHaveBeenCalledTimes(3);
    const next = mocks.onSnapshot.mock.calls[2];
    next[1]({ docs: [{ id: "current" }] });
    old[2](new Error("Late error"));
    old[1]({ docs: [] });
    await projects({ docs: [{ id: "cached" }] });
    expect(mocks.onSnapshot).toHaveBeenCalledTimes(3);
    expect(store.getState().ProjectsReducer.projects.cached.tags).toEqual([
        "current"
    ]);
    stop();
    next[2](new Error("After unmount"));
    await projects({ docs: [{ id: "cached" }] });
    expect(mocks.onSnapshot).toHaveBeenCalledTimes(3);
});
