import { afterEach, expect, it, vi } from "vitest";
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor
} from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { DeleteAccountModal } from "./delete-account-modal";

const mocks = vi.hoisted(() => ({
    remove: vi.fn(),
    reauthenticate: vi.fn(),
    popupReauthenticate: vi.fn(),
    refreshToken: vi.fn(),
    signOut: vi.fn(),
    providerId: "password"
}));
vi.mock("@comp/modal/actions", () => ({ closeModal: vi.fn() }));
vi.mock("@comp/snackbar/actions", () => ({ openSnackbar: vi.fn() }));
vi.mock("@comp/router/navigate", () => ({ navigateTo: vi.fn() }));
vi.mock("./profile-dialog", () => ({
    ProfileDialog: ({
        title,
        children,
        actions
    }: {
        title: string;
        children: React.ReactNode;
        actions: React.ReactNode;
    }) => (
        <div>
            <h1>{title}</h1>
            {children}
            {actions}
        </div>
    )
}));
vi.mock("firebase/functions", () => ({
    getFunctions: vi.fn(),
    httpsCallable: () => mocks.remove
}));
vi.mock("firebase/auth", () => ({
    getAuth: () => ({
        currentUser: {
            email: "fixture@example.com",
            providerData: [{ providerId: mocks.providerId }],
            getIdToken: mocks.refreshToken
        }
    }),
    signOut: mocks.signOut,
    EmailAuthProvider: { credential: vi.fn() },
    reauthenticateWithCredential: mocks.reauthenticate,
    reauthenticateWithPopup: mocks.popupReauthenticate,
    GoogleAuthProvider: vi.fn(),
    FacebookAuthProvider: vi.fn()
}));
afterEach(() => {
    cleanup();
    vi.resetAllMocks();
});

it.each(["password", "google.com", "facebook.com"])(
    "refreshes the token after %s reauthentication before retrying deletion",
    async (providerId) => {
        mocks.providerId = providerId;
        mocks.remove
            .mockRejectedValueOnce(
                Object.assign(new Error("Sign in again"), {
                    code: "functions/failed-precondition",
                    details: { reason: "requires-recent-login" }
                })
            )
            .mockResolvedValueOnce({ data: { success: true } });
        render(
            <Provider store={configureStore({ reducer: () => ({}) })}>
                <DeleteAccountModal username="fixture-user" />
            </Provider>
        );
        fireEvent.change(
            screen.getByLabelText("Type your username to confirm"),
            {
                target: { value: "fixture-user" }
            }
        );
        fireEvent.click(screen.getByRole("button", { name: "Delete Account" }));
        await screen.findByRole("heading", { name: "Confirm your identity" });
        expect(mocks.signOut).not.toHaveBeenCalled();
        if (providerId === "password") {
            fireEvent.change(screen.getByLabelText("Password"), {
                target: { value: "fixture-password" }
            });
            fireEvent.click(
                screen.getByRole("button", { name: "Confirm & Delete Account" })
            );
        } else {
            const provider =
                providerId === "google.com" ? "Google" : "Facebook";
            fireEvent.click(
                screen.getByRole("button", {
                    name: `Continue with ${provider} & Delete`
                })
            );
        }
        await waitFor(() => expect(mocks.remove).toHaveBeenCalledTimes(2));
        expect(
            providerId === "password"
                ? mocks.reauthenticate
                : mocks.popupReauthenticate
        ).toHaveBeenCalledTimes(1);
        expect(mocks.refreshToken).toHaveBeenCalledWith(true);
        expect(mocks.refreshToken.mock.invocationCallOrder[0]).toBeLessThan(
            mocks.remove.mock.invocationCallOrder[1]
        );
        expect(mocks.signOut).toHaveBeenCalledTimes(1);
    }
);
