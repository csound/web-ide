import { beforeEach, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import HomeReducer from "./reducer";
import { fetchPopularProjects } from "./actions";
import type { AppThunkDispatch, RootState } from "@root/store";

const { popular, getDocs, where } = vi.hoisted(() => ({
    popular: vi.fn(),
    getDocs: vi.fn(),
    where: vi.fn()
}));
vi.mock("firebase/functions", () => ({
    getFunctions: () => ({}),
    httpsCallable: (_functions: unknown, name: string) =>
        name === "popular_projects" ? popular : vi.fn()
}));
vi.mock("firebase/firestore", () => ({
    getDocs,
    where,
    query: vi.fn(),
    documentId: () => "documentId"
}));
vi.mock("../../config/firestore", () => ({ profiles: "profiles" }));
vi.mock("../projects/utils", () => ({
    firestoreProjectToIProject: vi.fn()
}));

const project = {
    projectUid: "project1",
    userUid: "author",
    name: "A project",
    starCount: 5
};
const run = async (store: ReturnType<typeof createStore>) =>
    fetchPopularProjects()(
        store.dispatch as AppThunkDispatch,
        store.getState as () => RootState
    );
const createStore = () => configureStore({ reducer: { HomeReducer } });

beforeEach(() => {
    vi.clearAllMocks();
    getDocs.mockResolvedValue({ forEach: () => {} });
});

it("keeps the ranked response and replaces it on refresh without duplicate rows", async () => {
    popular.mockResolvedValue({
        data: [project, { ...project, projectUid: "project2" }]
    });
    const store = createStore();
    await run(store);
    await run(store);
    expect(store.getState().HomeReducer.popularProjects).toHaveLength(2);
    expect(store.getState().HomeReducer.popularProjects[0]).toEqual(project);
    expect(where).toHaveBeenCalledWith("documentId", "in", ["author"]);
    expect(store.getState().HomeReducer.popularProjectsLoading).toBe(false);
});

it("reports a failed request and clears the error after retry", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    const store = createStore();
    popular.mockRejectedValueOnce(new Error("offline"));
    await run(store);
    expect(store.getState().HomeReducer.popularProjectsError).toBe(
        "Could not load popular projects."
    );
    expect(store.getState().HomeReducer.popularProjectsLoading).toBe(false);
    popular.mockResolvedValue({ data: [] });
    await run(store);
    expect(store.getState().HomeReducer.popularProjectsError).toBeNull();
    expect(store.getState().HomeReducer.popularProjects).toEqual([]);
    errorLog.mockRestore();
});

it("shows projects even when author profiles fail to load", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    popular.mockResolvedValue({ data: [project] });
    getDocs.mockRejectedValue(new Error("profile unavailable"));
    const store = createStore();
    await run(store);
    expect(store.getState().HomeReducer.popularProjects).toEqual([project]);
    expect(store.getState().HomeReducer.popularProjectsError).toBeNull();
    errorLog.mockRestore();
});

it("handles the old IDs-only endpoint without crashing the page", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    popular.mockResolvedValue({ data: ["project1"] });
    const store = createStore();
    await run(store);
    expect(store.getState().HomeReducer.popularProjectsError).toBeTruthy();
    expect(store.getState().HomeReducer.popularProjects).toEqual([]);
    errorLog.mockRestore();
});
