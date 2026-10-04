import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { StarsList } from "./stars-list";
import ProfileReducer from "../reducer";
import ProjectsReducer from "../../projects/reducer";

const fixture = vi.hoisted(() => ({
    listeners: new Map<
        string,
        {
            next: (snapshot: unknown) => void;
            error: () => void;
            stop: ReturnType<typeof vi.fn>;
        }
    >(),
    records: new Map<string, Record<string, unknown>>(),
    onSnapshot: vi.fn()
}));
vi.mock("firebase/firestore", () => ({
    doc: (_collection: unknown, id: string) => id,
    onSnapshot: fixture.onSnapshot
}));
vi.mock("../../../config/firestore", () => ({ projects: "projects" }));
const snapshot = (id: string, fromCache = false) => ({
    exists: () => fixture.records.has(id),
    data: () => fixture.records.get(id),
    metadata: { fromCache }
});
beforeEach(() => {
    fixture.records.clear();
    fixture.listeners.clear();
    vi.clearAllMocks();
    fixture.records.set("public", {
        name: "Public study",
        description: "A public project",
        public: true
    });
    fixture.records.set("hidden", { name: "Hidden study", public: false });
    fixture.onSnapshot.mockImplementation((id, _options, next, error) => {
        const stop = vi.fn();
        fixture.listeners.set(id, { next, error, stop });
        next(snapshot(id));
        return stop;
    });
});
vi.mock("@elem/project-avatar", () => ({ default: () => null }));
afterEach(cleanup);
const publicProject = {
    projectUid: "public",
    userUid: "author",
    name: "Public study",
    description: "A public project",
    isPublic: true,
    tags: [],
    stars: {},
    documents: {}
};
function setup(ids: string[]) {
    const store = configureStore({
        reducer: { ProfileReducer, ProjectsReducer }
    });
    store.dispatch({
        type: "PROFILE.STORE_USER_PROFILE",
        profileUid: "fixture",
        profile: { stars: ids }
    });
    store.dispatch({
        type: "PROJECTS.STORE_PROJECT_LOCALLY",
        projects: [
            publicProject,
            {
                ...publicProject,
                projectUid: "hidden",
                name: "Hidden study",
                isPublic: false
            }
        ]
    });
    const view = render(
        <Provider store={store}>
            <MemoryRouter>
                <StarsList profileUid="fixture" />
            </MemoryRouter>
        </Provider>
    );
    return { store, ...view };
}
it("omits missing, hidden and empty starred project links", () => {
    setup(["public", "missing", "hidden", ""]);
    expect(screen.getAllByRole("link").map((row) => row.textContent)).toEqual([
        "Public studyA public project"
    ]);
});
it("shows an empty state when no starred projects are visible", () => {
    setup(["missing", "hidden", ""]);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.getByText("No public starred projects")).toBeDefined();
});

it("rechecks cached projects and removes stars when a project becomes hidden or deleted", () => {
    const { store, unmount } = setup(["public", "missing", "hidden"]);
    expect(screen.getByRole("link").getAttribute("href")).toBe(
        "/editor/public"
    );
    act(() => {
        fixture.records.get("public")!.public = false;
        fixture.listeners.get("public")!.next(snapshot("public"));
    });
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    act(() => {
        fixture.records.get("public")!.public = true;
        fixture.listeners.get("public")!.next(snapshot("public"));
    });
    expect(screen.getAllByRole("link")).toHaveLength(1);
    act(() => {
        fixture.records.delete("public");
        fixture.listeners.get("public")!.next(snapshot("public"));
    });
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    // Viewing stars never changes star membership or the editor's cached work.
    expect(store.getState().ProfileReducer.profiles.fixture.stars).toEqual([
        "public",
        "missing",
        "hidden"
    ]);
    expect(store.getState().ProjectsReducer.projects.public).toMatchObject(
        publicProject
    );
    unmount();
    for (const listener of fixture.listeners.values())
        expect(listener.stop).toHaveBeenCalledOnce();
});
it("ignores stale cache snapshots and hides permission-denied projects", () => {
    fixture.onSnapshot.mockImplementation((id, _options, next, error) => {
        const stop = vi.fn();
        fixture.listeners.set(id, { next, error, stop });
        next(snapshot(id, true));
        return stop;
    });
    setup(["public"]);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.getByRole("progressbar")).toBeDefined();
    act(() => fixture.listeners.get("public")!.error());
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.queryByRole("progressbar")).toBeNull();
});
it("clears removed stars and ignores old callbacks", () => {
    const { store } = setup(["public", "bad/path", ".."]);
    expect(fixture.onSnapshot).toHaveBeenCalledTimes(1);
    const old = fixture.listeners.get("public")!;
    act(() =>
        store.dispatch({
            type: "PROFILE.STORE_USER_PROFILE",
            profileUid: "fixture",
            profile: { stars: [] }
        })
    );
    expect(old.stop).toHaveBeenCalledOnce();
    act(() => old.next(snapshot("public")));
    expect(screen.queryAllByRole("link")).toHaveLength(0);
});

it.each([false, undefined])(
    "does not trust a public cache entry when the current project is %s",
    (visibility) => {
        if (visibility === undefined) fixture.records.delete("public");
        else fixture.records.get("public")!.public = visibility;
        setup(["public"]);
        expect(screen.queryAllByRole("link")).toHaveLength(0);
    }
);
it("omits unnamed project records", () => {
    fixture.records.get("public")!.name = " ";
    setup(["public"]);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
});
