import { beforeEach, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { getDoc } from "firebase/firestore";
import {
    subscribeToFollowers,
    subscribeToFollowing,
    subscribeToProfileStars
} from "./subscribers";
import ProfileReducer from "./reducer";
import { STORE_USER_PROFILE } from "./types";

const mocks = vi.hoisted(() => ({
    onSnapshot: vi.fn(),
    unsubscribe: vi.fn(),
    getState: vi.fn()
}));
vi.mock("firebase/firestore", () => ({
    doc: (collection: string, id: string) => `${collection}/${id}`,
    getDoc: vi.fn(),
    onSnapshot: mocks.onSnapshot
}));
vi.mock("../../config/firestore", () => ({
    following: "following",
    followers: "followers",
    profiles: "profiles",
    profileStars: "profileStars"
}));
vi.mock("../../store", () => ({
    store: { getState: mocks.getState }
}));
vi.mock("../projects/actions", () => ({}));
vi.mock("../projects/utils", () => ({}));
vi.mock("./actions", () => ({
    storeProfileStars: (stars: unknown, profileUid: string) => ({
        type: "PROFILE.STORE_PROFILE_STARS",
        stars,
        profileUid
    }),
    setStarsLoading: (profileUid: string, isLoading: boolean) => ({
        type: "PROFILE.SET_STARS_LOADING",
        profileUid,
        isLoading
    }),
    setFollowingLoading: (profileUid: string, isLoading: boolean) => ({
        type: "PROFILE.SET_FOLLOWING_LOADING",
        profileUid,
        isLoading
    }),
    setFollowersLoading: (profileUid: string, isLoading: boolean) => ({
        type: "PROFILE.SET_FOLLOWERS_LOADING",
        profileUid,
        isLoading
    })
}));

const snapshot = (id: string, data?: Record<string, unknown>) => ({
    id,
    exists: () => data !== undefined,
    data: () => data
});

beforeEach(() => {
    vi.clearAllMocks();
    mocks.onSnapshot.mockReturnValue(mocks.unsubscribe);
});

it.each([
    ["following", subscribeToFollowing],
    ["followers", subscribeToFollowers]
] as const)(
    "omits deleted %s profiles and uses document IDs for existing profiles",
    async (relation, subscribe) => {
        const store = configureStore({ reducer: { ProfileReducer } });
        mocks.getState.mockImplementation(store.getState);
        store.dispatch({
            type: STORE_USER_PROFILE,
            profileUid: "deleted",
            profile: { userUid: "deleted", username: "old-name" }
        });
        vi.mocked(getDoc).mockImplementation(
            async (reference) =>
                snapshot(
                    String(reference).split("/")[1],
                    String(reference) === "profiles/exists"
                        ? {
                              username: "current",
                              userJoinDate: { toMillis: () => 123 }
                          }
                        : undefined
                ) as any
        );
        const unsubscribe = subscribe("owner", store.dispatch);
        const receive = mocks.onSnapshot.mock.calls[0][1];
        await receive(snapshot("owner", { deleted: 2, exists: 1 }));
        expect(
            store.getState().ProfileReducer.profiles.owner[relation]
        ).toEqual(["exists"]);
        expect(store.getState().ProfileReducer.profiles.exists).toMatchObject({
            userUid: "exists",
            username: "current",
            userJoinDate: 123
        });
        expect(
            store.getState().ProfileReducer.profiles.undefined
        ).toBeUndefined();
        expect(
            store.getState().ProfileReducer[`${relation}Loading`].owner
        ).toBe(false);
        await receive(snapshot("owner"));
        expect(
            store.getState().ProfileReducer.profiles.owner[relation]
        ).toEqual([]);
        unsubscribe();
        expect(mocks.unsubscribe).toHaveBeenCalledOnce();
    }
);

it("ignores profile reads after a newer list snapshot or unsubscribe", async () => {
    const dispatch = vi.fn();
    let complete!: (value: any) => void;
    vi.mocked(getDoc).mockImplementation(
        () =>
            new Promise((resolve) => {
                complete = resolve;
            })
    );
    const unsubscribe = subscribeToFollowing("owner", dispatch);
    const receive = mocks.onSnapshot.mock.calls[0][1];
    const pending = receive(snapshot("owner", { old: 1 }));
    await receive(snapshot("owner", {}));
    dispatch.mockClear();
    complete(snapshot("old", { username: "old" }));
    await pending;
    expect(dispatch).not.toHaveBeenCalled();
    const afterUnmount = receive(snapshot("owner", { old: 1 }));
    unsubscribe();
    dispatch.mockClear();
    complete(snapshot("old", { username: "old" }));
    await afterUnmount;
    expect(dispatch).not.toHaveBeenCalled();
});

it("clears loading after a failed read without treating it as a deletion", async () => {
    const dispatch = vi.fn();
    const error = new Error("read failed");
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
        vi.mocked(getDoc).mockRejectedValue(error);
        subscribeToFollowing("owner", dispatch);
        await mocks.onSnapshot.mock.calls[0][1](
            snapshot("owner", { exists: 1 })
        );
        expect(dispatch).toHaveBeenLastCalledWith({
            type: "PROFILE.SET_FOLLOWING_LOADING",
            profileUid: "owner",
            isLoading: false
        });
        expect(
            dispatch.mock.calls.every(
                ([action]) => action.type === "PROFILE.SET_FOLLOWING_LOADING"
            )
        ).toBe(true);
        expect(logged).toHaveBeenCalledWith(error);
    } finally {
        logged.mockRestore();
    }
});

it("clears cached stars when the star record disappears", () => {
    const store = configureStore({ reducer: { ProfileReducer } });
    const stop = subscribeToProfileStars("fixture", store.dispatch);
    const receive = mocks.onSnapshot.mock.calls[0][1];
    receive(
        snapshot("fixture", { public: { toMillis: () => 123 }, missing: null })
    );
    expect(store.getState().ProfileReducer.profiles.fixture.stars).toEqual([
        "missing",
        "public"
    ]);
    expect(store.getState().ProfileReducer.starsLoading.fixture).toBe(false);
    receive(snapshot("fixture"));
    expect(store.getState().ProfileReducer.profiles.fixture.stars).toEqual([]);
    stop();
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
});
