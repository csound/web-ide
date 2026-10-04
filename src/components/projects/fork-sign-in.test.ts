import { configureStore } from "@reduxjs/toolkit";
import { expect, it, vi } from "vitest";
import LoginReducer from "../login/reducer";
import ModalReducer from "../modal/reducer";
import ProjectsReducer from "./reducer";
import { openForkProject } from "./fork-project";
import { thirdPartyAuthSuccess, closeLoginDialog } from "../login/actions";

const fixture = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock("../router/navigate", () => ({ navigateTo: fixture.navigate }));
vi.mock("firebase/firestore", async (original) => ({
    ...(await original<typeof import("firebase/firestore")>()),
    getDoc: async () => ({
        exists: () => true,
        data: () => ({ username: "fixture-reader" })
    })
}));

function createStore() {
    const store = configureStore({
        reducer: { LoginReducer, ModalReducer, ProjectsReducer }
    });
    store.dispatch({
        type: "PROJECTS.STORE_PROJECT_LOCALLY",
        projects: [
            {
                projectUid: "source",
                userUid: "author",
                name: "Study",
                description: "",
                documents: {},
                stars: {},
                tags: [],
                isPublic: true
            }
        ]
    });
    return store;
}
it("resumes the fork dialog after sign-in instead of leaving the source editor", async () => {
    const store = createStore();
    await store.dispatch(openForkProject("source") as any);
    expect(store.getState().LoginReducer.isLoginDialogOpen).toBe(true);
    expect(store.getState().LoginReducer.postAuthFlow).toEqual({
        forkProjectUid: "source"
    });
    expect(store.getState().ModalReducer.isOpen).toBe(false);
    // The auth observer can classify a fast sign-in as an automatic one.
    await store.dispatch(
        thirdPartyAuthSuccess(
            { uid: "reader", displayName: "Reader" },
            true
        ) as any
    );
    expect(store.getState().LoginReducer.postAuthFlow).toBeUndefined();
    expect(store.getState().ModalReducer.properties).toMatchObject({
        forkSourceUid: "source",
        name: "Study (fork)"
    });
    expect(fixture.navigate).not.toHaveBeenCalled();
});
it("forgets a cancelled fork sign-in", async () => {
    const store = createStore();
    await store.dispatch(openForkProject("source") as any);
    await store.dispatch(closeLoginDialog() as any);
    expect(store.getState().LoginReducer.postAuthFlow).toBeUndefined();
});
