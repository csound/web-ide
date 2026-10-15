import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { GitHubConnection } from "./github-connection";

const mocks = vi.hoisted(() => {
    const user = { uid: "owner", providerData: [{ providerId: "google.com" }] };
    return {
        user,
        auth: { currentUser: user as typeof user | null },
        connect: vi.fn(),
        unsubscribe: vi.fn(),
        observer: (_user: typeof user | null) => {}
    };
});

vi.mock("@root/utils", () => ({ isElectron: false }));
vi.mock("firebase/auth", async (original) => ({
    ...(await original<typeof import("firebase/auth")>()),
    getAuth: () => mocks.auth,
    linkWithPopup: mocks.connect,
    onAuthStateChanged: (_auth: unknown, callback: typeof mocks.observer) => {
        mocks.observer = callback;
        callback(mocks.auth.currentUser);
        return mocks.unsubscribe;
    }
}));

beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.currentUser = mocks.user;
    mocks.user.providerData = [{ providerId: "google.com" }];
});
afterEach(cleanup);

it("shows a connected state for an existing link", () => {
    mocks.user.providerData.push({ providerId: "github.com" });
    render(<GitHubConnection />);
    expect(screen.getByRole("status").textContent).toContain(
        "GitHub connected"
    );
    expect(screen.queryByRole("button")).toBeNull();
});

it("prevents duplicate requests and updates the connection without a profile save", async () => {
    let finish = (_value: { user: typeof mocks.user }) => {};
    mocks.connect.mockReturnValue(
        new Promise<{ user: typeof mocks.user }>((resolve) => {
            finish = resolve;
        })
    );
    render(<GitHubConnection />);
    fireEvent.click(screen.getByRole("button", { name: "Connect GitHub" }));
    const button = screen.getByRole("button", { name: "Connecting…" });
    expect(button.hasAttribute("disabled")).toBe(true);
    fireEvent.click(button);
    expect(mocks.connect).toHaveBeenCalledTimes(1);
    mocks.user.providerData.push({ providerId: "github.com" });
    await act(async () => finish({ user: mocks.user }));
    expect(screen.getByRole("status").textContent).toContain(
        "GitHub connected"
    );
});

it.each(["auth/popup-closed-by-user", "auth/credential-already-in-use"])(
    "keeps the connection available after %s",
    async (code) => {
        mocks.connect.mockRejectedValueOnce({ code });
        render(<GitHubConnection />);
        fireEvent.click(screen.getByRole("button", { name: "Connect GitHub" }));
        await waitFor(() =>
            expect(screen.getByRole("button").hasAttribute("disabled")).toBe(
                false
            )
        );
        if (code === "auth/credential-already-in-use") {
            expect(screen.getByRole("alert").textContent).toContain(
                "another IDE account"
            );
        } else {
            expect(screen.queryByRole("alert")).toBeNull();
        }
        expect(screen.queryByRole("status")).toBeNull();
    }
);

it("hides account controls on sign-out and unsubscribes on close", () => {
    const { unmount } = render(<GitHubConnection />);
    act(() => {
        mocks.auth.currentUser = null;
        mocks.observer(null);
    });
    expect(screen.queryByRole("button")).toBeNull();
    unmount();
    expect(mocks.unsubscribe).toHaveBeenCalledTimes(1);
});
