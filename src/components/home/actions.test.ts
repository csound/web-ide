import { beforeEach, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import HomeReducer from "./reducer";
import {
    fetchPopularArtists,
    fetchPopularProjects,
    fetchRandomProjects
} from "./actions";
import { ADD_USER_PROFILES } from "./types";
import type { AppThunkDispatch, RootState } from "@root/store";

const { popular, artists, random, getDocs, where } = vi.hoisted(() => ({
    popular: vi.fn(),
    artists: vi.fn(),
    random: vi.fn(),
    getDocs: vi.fn(),
    where: vi.fn()
}));
vi.mock("firebase/functions", () => ({
    getFunctions: () => ({}),
    httpsCallable: (_functions: unknown, name: string) =>
        name === "popular_projects"
            ? popular
            : name === "popular_artists"
              ? artists
              : random
}));
vi.mock("firebase/firestore", () => ({
    getDocs,
    where,
    query: (collection: string, filter: unknown) => ({ collection, filter }),
    documentId: () => "documentId"
}));
vi.mock("../../config/firestore", () => ({
    profiles: "profiles",
    usernames: "usernames"
}));
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

const snapshot = (records: Record<string, unknown>) => ({
    forEach: (visit: (doc: { id: string; data: () => unknown }) => void) => {
        for (const [id, data] of Object.entries(records))
            visit({ id, data: () => data });
    }
});

const rankArtists = async (store: ReturnType<typeof createStore>) =>
    fetchPopularArtists()(
        store.dispatch as AppThunkDispatch,
        store.getState as () => RootState
    );

it.each(["artists", "projects", "random"])(
    "%s resolves a blank profile username from its registered address",
    async (ranking) => {
        artists.mockResolvedValue({
            data: [{ userUid: "author", totalStars: 1, projectCount: 1 }]
        });
        popular.mockResolvedValue({ data: [project] });
        random.mockResolvedValue({ data: [project] });
        getDocs.mockImplementation(async ({ collection }) =>
            snapshot(
                collection === "profiles"
                    ? {
                          author: {
                              displayName: "Fixture Artist",
                              username: ""
                          }
                      }
                    : { "fixture-artist": { userUid: "author" } }
            )
        );
        const store = createStore();
        if (ranking === "artists") await rankArtists(store);
        else if (ranking === "projects") await run(store);
        else await store.dispatch(fetchRandomProjects() as any);
        expect(store.getState().HomeReducer.profiles.author).toMatchObject({
            displayName: "Fixture Artist",
            username: "fixture-artist"
        });
        expect(where).toHaveBeenCalledWith("userUid", "in", ["author"]);
    }
);

it("resolves a username even when a blank profile was already cached", async () => {
    const store = createStore();
    store.dispatch({
        type: ADD_USER_PROFILES,
        payload: { author: { displayName: "Fixture Artist", username: "" } }
    });
    artists.mockResolvedValue({
        data: [{ userUid: "author", totalStars: 1, projectCount: 1 }]
    });
    getDocs.mockImplementation(async ({ collection }) =>
        snapshot(
            collection === "profiles"
                ? { author: { displayName: "Fixture Artist", username: "" } }
                : { "fixture-artist": { userUid: "author" } }
        )
    );
    await rankArtists(store);
    expect(store.getState().HomeReducer.profiles.author.username).toBe(
        "fixture-artist"
    );
});

it.each([{}, { first: { userUid: "author" }, second: { userUid: "author" } }])(
    "does not invent a username when mappings are missing or ambiguous: %j",
    async (names) => {
        artists.mockResolvedValue({
            data: [{ userUid: "author", totalStars: 1, projectCount: 1 }]
        });
        getDocs.mockImplementation(async ({ collection }) =>
            snapshot(
                collection === "profiles"
                    ? {
                          author: {
                              displayName: "Fixture Artist",
                              username: ""
                          }
                      }
                    : names
            )
        );
        const store = createStore();
        await rankArtists(store);
        expect(store.getState().HomeReducer.profiles.author.username).toBe("");
    }
);

it("does not restore a removed profile from a username mapping", async () => {
    artists.mockResolvedValue({
        data: [{ userUid: "author", totalStars: 1, projectCount: 1 }]
    });
    getDocs.mockImplementation(async ({ collection }) =>
        snapshot(
            collection === "profiles"
                ? {}
                : { "fixture-artist": { userUid: "author" } }
        )
    );
    const store = createStore();
    await rankArtists(store);
    expect(store.getState().HomeReducer.profiles).not.toHaveProperty("author");
    expect(getDocs).toHaveBeenCalledTimes(1);
});

it("keeps the artist visible when the username lookup fails", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    artists.mockResolvedValue({
        data: [{ userUid: "author", totalStars: 1, projectCount: 1 }]
    });
    getDocs.mockImplementation(async ({ collection }) => {
        if (collection === "usernames") throw new Error("lookup unavailable");
        return snapshot({
            author: { displayName: "Fixture Artist", username: "" }
        });
    });
    const store = createStore();
    await rankArtists(store);
    expect(store.getState().HomeReducer.profiles.author.displayName).toBe(
        "Fixture Artist"
    );
    expect(store.getState().HomeReducer.popularArtistsError).toBeNull();
    errorLog.mockRestore();
});
