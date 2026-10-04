import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { StrictMode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { reducer } from "../../store/root-reducer";
import { SIGNIN_SUCCESS, SET_REQUESTING_STATUS } from "../login/types";
import type { IDocument, IProject } from "../projects/types";
import {
    closeTabDock,
    splitActivePanel,
    switchPanelTab,
    tabDockInit,
    toggleMaximizePanel
} from "./actions";
import { persistentWorkspace } from "./temporary-documents";
import { useGuestReadme } from "./use-guest-readme";

vi.mock("../../store", async () => {
    const { useDispatch, useSelector } = await import("react-redux");
    const { createAsyncThunk } = await import("@reduxjs/toolkit");
    return { useDispatch, useSelector, createAsyncThunk };
});

const document = (
    uid: string,
    filename: string,
    path: string[] = []
): IDocument => ({
    documentUid: uid,
    filename,
    path,
    type: "txt",
    currentValue: "",
    savedValue: "",
    isModifiedLocally: false,
    userUid: "author",
    created: undefined,
    lastModified: undefined
});
const project: IProject = {
    projectUid: "guest-readme-test",
    userUid: "author",
    name: "Fixture",
    description: "",
    isPublic: true,
    tags: [],
    stars: {},
    documents: {
        csd: document("csd", "project.csd"),
        readme: document("readme", "README.md")
    }
};
beforeEach(() => localStorage.clear());
afterEach(cleanup);
function setup(uid?: string, pending = false, value = project) {
    const store = configureStore({ reducer });
    store.dispatch({
        type: "PROJECTS.STORE_PROJECT_LOCALLY",
        projects: [value]
    });
    store.dispatch({
        type: "PROJECTS.ACTIVATE_PROJECT",
        projectUid: value.projectUid
    });
    if (uid) store.dispatch({ type: SIGNIN_SUCCESS, user: { uid } });
    store.dispatch({ type: SET_REQUESTING_STATUS, status: pending });
    const open = () =>
        store.dispatch(
            tabDockInit(
                value.projectUid,
                Object.values(value.documents),
                undefined
            )
        );
    const mount = () =>
        renderHook(() => useGuestReadme(value), {
            wrapper: ({ children }) => (
                <StrictMode>
                    <Provider store={store}>{children}</Provider>
                </StrictMode>
            )
        });
    const state = () => store.getState().ProjectEditorReducer;
    const focused = () =>
        state().tabDock.openDocuments[state().tabDock.tabIndex]?.uid;
    return { store, open, mount, state, focused };
}
function savedTabs(uids = ["csd", "readme"]) {
    localStorage.setItem(
        `${project.projectUid}:tabOrder`,
        JSON.stringify(uids)
    );
    localStorage.setItem(`${project.projectUid}:tabIndex`, "0");
}

it.each([undefined, "another-user"])(
    "focuses README for visitor %s without discarding saved tabs",
    async (uid) => {
        savedTabs();
        const fixture = setup(uid);
        await fixture.open();
        expect(fixture.focused()).toBe("csd");
        fixture.mount();
        expect(fixture.focused()).toBe("readme");
        expect(
            fixture.state().tabDock.openDocuments.map((tab) => tab.uid)
        ).toEqual(["csd", "readme"]);
        act(() => fixture.store.dispatch(switchPanelTab("panel-1", 0)));
        expect(fixture.focused()).toBe("csd");
    }
);

it("adds a closed README on each return visit and leaves the other tabs open", async () => {
    savedTabs(["csd"]);
    const fixture = setup();
    await fixture.open();
    const hook = fixture.mount();
    expect(fixture.focused()).toBe("readme");
    act(() => fixture.store.dispatch(switchPanelTab("panel-1", 0)));
    localStorage.setItem(
        `${project.projectUid}:workspaceLayout`,
        JSON.stringify(persistentWorkspace(fixture.state()))
    );
    hook.unmount();
    fixture.store.dispatch(closeTabDock());
    await fixture.open();
    expect(fixture.focused()).toBe("csd");
    fixture.mount();
    expect(fixture.focused()).toBe("readme");
    expect(fixture.state().tabDock.openDocuments.map((tab) => tab.uid)).toEqual(
        ["csd", "readme"]
    );
});

it("focuses an existing README in another pane without duplicating it", async () => {
    savedTabs();
    const fixture = setup();
    await fixture.open();
    fixture.store.dispatch(switchPanelTab("panel-1", 1));
    fixture.store.dispatch(splitActivePanel("right"));
    const readmePanel = fixture.state().activePanelId;
    fixture.store.dispatch(switchPanelTab("panel-1", 0));
    fixture.store.dispatch(toggleMaximizePanel("panel-1"));
    const layout = persistentWorkspace(fixture.state());
    localStorage.setItem(
        `${project.projectUid}:workspaceLayout`,
        JSON.stringify(layout)
    );
    fixture.store.dispatch(closeTabDock());
    await fixture.open();
    fixture.mount();
    expect(fixture.focused()).toBe("readme");
    expect(fixture.state().activePanelId).toBe(readmePanel);
    expect(fixture.state().root).toEqual(layout.root);
    expect(fixture.state().maximizedPanelId).toBeNull();
});

it.each(["author", undefined])(
    "waits for sign-in before choosing the initial document (%s)",
    async (uid) => {
        savedTabs();
        const fixture = setup(undefined, true);
        await fixture.open();
        fixture.mount();
        expect(fixture.focused()).toBe("csd");
        act(() => {
            if (uid)
                fixture.store.dispatch({ type: SIGNIN_SUCCESS, user: { uid } });
            else
                fixture.store.dispatch({
                    type: SET_REQUESTING_STATUS,
                    status: false
                });
        });
        expect(fixture.focused()).toBe(uid ? "csd" : "readme");
    }
);

it("waits for workspace restoration even when project metadata arrives first", async () => {
    savedTabs();
    const fixture = setup();
    fixture.mount();
    expect(fixture.state().tabDock.openDocuments).toEqual([]);
    await act(async () => {
        await fixture.open();
    });
    expect(fixture.focused()).toBe("readme");
});

it("keeps the current file when there is no README", async () => {
    savedTabs(["csd"]);
    const fixture = setup(undefined, false, {
        ...project,
        documents: { csd: project.documents.csd }
    });
    await fixture.open();
    fixture.mount();
    expect(fixture.focused()).toBe("csd");
});

it("prefers the root README to a README in a folder", async () => {
    savedTabs(["csd"]);
    const fixture = setup(undefined, false, {
        ...project,
        documents: {
            nested: document("nested", "README.md", ["examples"]),
            ...project.documents
        }
    });
    await fixture.open();
    fixture.mount();
    expect(fixture.focused()).toBe("readme");
});
