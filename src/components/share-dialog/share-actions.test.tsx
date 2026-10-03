import { afterEach, expect, it, vi } from "vitest";
import {
    act,
    cleanup,
    fireEvent,
    render,
    screen
} from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider, useSelector } from "react-redux";
import { store as appStore, RootState } from "../../store";
import { reducer } from "../../store/root-reducer";
import ThemeProvider from "../../styles/theme-provider";
import { ConsoleProvider } from "../console/context";
import { MenuBar } from "../menu-bar/menu-bar";
import SocialControls from "../social-controls/social-controls";
import ShareDialog from "./index";

vi.mock("../social-controls/subscribers", () => ({
    subscribeToProjectStars: () => () => {}
}));
vi.mock("firebase/firestore", async (importOriginal) => ({
    ...(await importOriginal<typeof import("firebase/firestore")>()),
    getDoc: vi.fn(async () => ({ data: () => undefined }))
}));

afterEach(cleanup);

const ShareWhenOpen = () => {
    const modal = useSelector((state: RootState) => state.ModalReducer);
    return modal.isOpen && modal.modalComponentName === "share-dialog" ? (
        <ShareDialog />
    ) : null;
};

function show(isOwner: boolean, isPublic: boolean) {
    const initial = appStore.getState();
    const store = configureStore({
        reducer,
        preloadedState: {
            ...initial,
            LoginReducer: {
                ...initial.LoginReducer,
                loggedInUid: isOwner ? "composer" : "visitor",
                requesting: false
            },
            ProjectsReducer: {
                activeProjectUid: "share-actions",
                projects: {
                    "share-actions": {
                        projectUid: "share-actions",
                        userUid: "composer",
                        name: "Etude",
                        description: "",
                        isPublic,
                        documents: {},
                        stars: {},
                        tags: []
                    }
                }
            }
        }
    });
    render(
        <Provider store={store}>
            <ThemeProvider>
                <ConsoleProvider>
                    <MenuBar projectUid="share-actions" />
                    <SocialControls activeProjectUid="share-actions" />
                    <ShareWhenOpen />
                </ConsoleProvider>
            </ThemeProvider>
        </Provider>
    );
    return store;
}

it("lets an owner reach the private-project explanation from the Project menu", () => {
    show(true, false);
    fireEvent.click(screen.getByText("Project"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Share Project" }));
    expect(
        screen.getByText(/Make this project public to embed it/)
    ).toBeTruthy();
    expect(screen.queryByLabelText("HTML embed code")).toBeNull();
});

it("lets an owner open Share from the toolbar while their project is private", () => {
    show(true, false);
    fireEvent.click(screen.getByRole("button", { name: "Share this project" }));
    expect(
        screen.getByText(/Make this project public to embed it/)
    ).toBeTruthy();
});

it("keeps private projects unavailable to visitors", () => {
    const store = show(false, false);
    expect(
        screen.queryByRole("button", { name: "Share this project" })
    ).toBeNull();
    fireEvent.click(screen.getByText("Project"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Share Project" }));
    expect(store.getState().ModalReducer.isOpen).toBe(false);
});

it("updates the menu when project visibility changes", () => {
    const store = show(false, true);
    act(() => {
        store.dispatch({
            type: "PROJECTS.SET_PROJECT_PUBLIC",
            projectUid: "share-actions",
            isPublic: false
        });
    });
    fireEvent.click(screen.getByText("Project"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Share Project" }));
    expect(store.getState().ModalReducer.isOpen).toBe(false);
});
