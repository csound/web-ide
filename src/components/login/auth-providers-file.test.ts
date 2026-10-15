import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getAuth } from "firebase/auth";
import {
    authErrorMessage,
    connectGitHub,
    createAuthProvider,
    getAuthProviderRedirectResult,
    reauthenticateWithAuthProvider,
    signInWithAuthProvider
} from "./auth-providers";

const mocks = vi.hoisted(() => {
    const user = {
        uid: "existing-owner",
        providerData: [{ providerId: "google.com" }]
    };
    return {
        user,
        auth: { currentUser: user },
        signIn: vi.fn(),
        signInRedirect: vi.fn(),
        link: vi.fn(),
        linkRedirect: vi.fn(),
        redirectResult: vi.fn(),
        reauthenticate: vi.fn()
    };
});

vi.mock("firebase/auth", async (original) => ({
    ...(await original<typeof import("firebase/auth")>()),
    getAuth: () => mocks.auth,
    signInWithPopup: mocks.signIn,
    signInWithRedirect: mocks.signInRedirect,
    linkWithPopup: mocks.link,
    linkWithRedirect: mocks.linkRedirect,
    getRedirectResult: mocks.redirectResult,
    reauthenticateWithPopup: mocks.reauthenticate
}));

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("window", {
        location: new URL("file:///app/dist/index.html")
    });
    mocks.signIn.mockResolvedValue({ user: mocks.user });
    mocks.signInRedirect.mockResolvedValue(undefined);
    mocks.link.mockResolvedValue({ user: mocks.user });
});

afterEach(() => vi.unstubAllGlobals());

it.each([false, true])(
    "rejects provider sign-in from the packaged file URL (redirect: %s)",
    async (redirect) => {
        await expect(
            signInWithAuthProvider("github", redirect)
        ).rejects.toThrow("ide.csound.com");
        expect(mocks.signIn).not.toHaveBeenCalled();
        expect(mocks.signInRedirect).not.toHaveBeenCalled();
    }
);

it("skips redirect recovery on file:// without a startup error", async () => {
    expect(await getAuthProviderRedirectResult()).toBeNull();
    expect(mocks.redirectResult).not.toHaveBeenCalled();
});

it("does not start provider reauthentication on file://", async () => {
    await expect(
        reauthenticateWithAuthProvider(
            getAuth().currentUser!,
            createAuthProvider("github")
        )
    ).rejects.toThrow("ide.csound.com");
    expect(mocks.reauthenticate).not.toHaveBeenCalled();
});

it("offers a web fallback for Firebase environment errors", () => {
    expect(
        authErrorMessage({
            code: "auth/operation-not-supported-in-this-environment"
        })
    ).toContain("ide.csound.com");
});

it.each([false, true])(
    "does not start linking or change the user from file:// (redirect: %s)",
    async (redirect) => {
        await expect(connectGitHub(redirect)).rejects.toThrow("ide.csound.com");
        expect(mocks.link).not.toHaveBeenCalled();
        expect(mocks.linkRedirect).not.toHaveBeenCalled();
        expect(mocks.auth.currentUser.uid).toBe("existing-owner");
    }
);
