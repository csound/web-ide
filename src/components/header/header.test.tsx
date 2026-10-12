import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
    act,
    cleanup,
    fireEvent,
    render,
    screen
} from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import palette from "../../styles/_theme-monokai";
import { Header } from "./header";
import LoginReducer from "../login/reducer";
import ProfileReducer from "../profile/reducer";
import { subscribeToLoggedInUserProfile } from "../login/subscribers";
import { LOG_OUT, SIGNIN_SUCCESS } from "../login/types";
import { STORE_USER_PROFILE } from "../profile/types";

const mocks = vi.hoisted(() => ({
    onSnapshot: vi.fn(),
    unsubscribe: vi.fn(),
    editProfile: vi.fn(() => ({ type: "TEST.EDIT_PROFILE" }))
}));
vi.mock("../../store", async () => {
    const { useDispatch, useSelector } = await import("react-redux");
    return { useDispatch, useSelector };
});
vi.mock("firebase/firestore", () => ({
    doc: (collection: string, uid: string) => `${collection}/${uid}`,
    onSnapshot: mocks.onSnapshot
}));
vi.mock("../../config/firestore", () => ({ profiles: "profiles" }));
vi.mock("../login/actions", () => ({}));
vi.mock("../login/login", () => ({ default: () => null }));
vi.mock("../profile/actions", () => ({ editProfile: mocks.editProfile }));
vi.mock("../menu-bar/menu-bar", () => ({ MenuBar: () => null }));
vi.mock("../projects/fork-attribution", () => ({
    ForkAttribution: () => null
}));
vi.mock("../target-controls", () => ({ TargetControls: () => null }));
vi.mock("../social-controls/social-controls", () => ({ default: () => null }));
vi.mock("./project-profile-meta", () => ({ default: () => null }));

beforeEach(() => {
    vi.clearAllMocks();
    mocks.onSnapshot.mockReturnValue(mocks.unsubscribe);
    vi.stubGlobal("matchMedia", (query: string) => ({
        matches: query === "(max-width:900px)" && window.innerWidth <= 900,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
    }));
    vi.stubGlobal("innerWidth", 1200);
});
afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

function setup() {
    const store = configureStore({
        reducer: {
            LoginReducer,
            ProfileReducer,
            ProjectsReducer: () => ({ activeProjectUid: "", projects: {} })
        }
    });
    store.dispatch({
        type: STORE_USER_PROFILE,
        profileUid: "owner",
        profile: { username: "old-name", displayName: "Old details" }
    });
    store.dispatch({ type: SIGNIN_SUCCESS, user: { uid: "owner" } });
    render(
        <Provider store={store}>
            <MemoryRouter>
                <ThemeProvider
                    theme={createTheme({
                        ...palette,
                        font: { regular: "sans-serif", monospace: "monospace" }
                    })}
                >
                    <Header />
                </ThemeProvider>
            </MemoryRouter>
        </Provider>
    );
    return store;
}

const snapshot = (username?: string) => ({
    data: () =>
        username ? { username, displayName: "Fresh details" } : undefined
});
const openMenu = () =>
    fireEvent.click(screen.getByRole("button", { name: "Open user menu" }));
const expectDisabledActions = () => {
    expect(screen.queryByRole("link", { name: "My projects" })).toBeNull();
    openMenu();
    for (const name of ["My projects", "Edit profile"]) {
        expect(
            screen.getByRole("menuitem", { name }).getAttribute("aria-disabled")
        ).toBe("true");
    }
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
};

it("waits for a new snapshot on same-account sign-in before using cached profile data", () => {
    const store = setup();
    const stop = subscribeToLoggedInUserProfile("owner", store.dispatch);
    const receive = mocks.onSnapshot.mock.calls[0][1];
    act(() => receive(snapshot("first-name")));
    expect(
        screen.getByRole("link", { name: "My projects" }).getAttribute("href")
    ).toBe("/profile/first-name");
    act(() => {
        stop();
        store.dispatch({ type: LOG_OUT });
        store.dispatch({ type: SIGNIN_SUCCESS, user: { uid: "owner" } });
        subscribeToLoggedInUserProfile("owner", store.dispatch);
    });
    expectDisabledActions();
    act(() => mocks.onSnapshot.mock.calls[1][1](snapshot("new-name")));
    expect(
        screen.getByRole("link", { name: "My projects" }).getAttribute("href")
    ).toBe("/profile/new-name");
    openMenu();
    expect(
        screen
            .getByRole("menuitem", { name: "My projects" })
            .getAttribute("href")
    ).toBe("/profile/new-name");
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit profile" }));
    expect(mocks.editProfile).toHaveBeenCalledWith(
        "new-name",
        "Fresh details",
        "",
        "",
        "",
        "",
        0
    );
});

it.each(["missing", "error"])(
    "disables profile actions after a %s snapshot",
    (failure) => {
        const store = setup();
        subscribeToLoggedInUserProfile("owner", store.dispatch);
        const [, receive, fail] = mocks.onSnapshot.mock.calls[0];
        act(() => receive(snapshot("fresh")));
        vi.spyOn(console, "error").mockImplementation(() => {});
        act(() =>
            failure === "missing"
                ? receive(snapshot())
                : fail(new Error("offline"))
        );
        expectDisabledActions();
    }
);

it("ignores callbacks after unsubscribing and keeps the next account's snapshot", () => {
    const store = setup();
    const stop = subscribeToLoggedInUserProfile("owner", store.dispatch);
    const [, receive, fail] = mocks.onSnapshot.mock.calls[0];
    act(() => {
        receive(snapshot("owner-name"));
        stop();
        store.dispatch({ type: SIGNIN_SUCCESS, user: { uid: "next" } });
        subscribeToLoggedInUserProfile("next", store.dispatch);
        mocks.onSnapshot.mock.calls[1][1](snapshot("next-name"));
        receive(snapshot("stale-name"));
        fail(new Error("late failure"));
        stop();
    });
    expect(
        screen.getByRole("link", { name: "My projects" }).getAttribute("href")
    ).toBe("/profile/next-name");
    expect(store.getState().ProfileReducer.profiles.owner.username).toBe(
        "owner-name"
    );
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
});

it.each([
    ["iPad", 901, true],
    ["Android", 1200, true],
    ["iPad", 900, false],
    ["desktop", 900, false]
])(
    "uses viewport width for the header link on %s at %ipx",
    (userAgent, width, visible) => {
        vi.spyOn(navigator, "userAgent", "get").mockReturnValue(userAgent);
        vi.stubGlobal("innerWidth", width);
        const store = setup();
        subscribeToLoggedInUserProfile("owner", store.dispatch);
        act(() => mocks.onSnapshot.mock.calls[0][1](snapshot("fresh")));
        expect(!!screen.queryByRole("link", { name: "My projects" })).toBe(
            visible
        );
        openMenu();
        expect(
            screen
                .getByRole("menuitem", { name: "My projects" })
                .getAttribute("href")
        ).toBe("/profile/fresh");
    }
);
