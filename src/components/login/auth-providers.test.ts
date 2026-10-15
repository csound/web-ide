import { beforeEach, expect, it, vi } from "vitest";
import {
    authErrorMessage,
    authWasCancelled,
    connectGitHub,
    createAuthProvider,
    getAuthProviderRedirectResult,
    signInWithAuthProvider
} from "./auth-providers";

const mocks = vi.hoisted(() => {
    const user = {
        uid: "existing-owner",
        providerData: [{ providerId: "google.com" }]
    };
    return {
        user,
        auth: { currentUser: user as typeof user | null },
        signIn: vi.fn(),
        signInRedirect: vi.fn(),
        link: vi.fn(),
        linkRedirect: vi.fn(),
        redirectResult: vi.fn()
    };
});

vi.mock("firebase/auth", async (original) => ({
    ...(await original<typeof import("firebase/auth")>()),
    getAuth: () => mocks.auth,
    signInWithPopup: mocks.signIn,
    signInWithRedirect: mocks.signInRedirect,
    linkWithPopup: mocks.link,
    linkWithRedirect: mocks.linkRedirect,
    getRedirectResult: mocks.redirectResult
}));

beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.currentUser = mocks.user;
    mocks.user.providerData = [{ providerId: "google.com" }];
    mocks.link.mockResolvedValue({ user: mocks.user });
});

it("requests email access for private GitHub emails, without repository access", () => {
    const provider = createAuthProvider("github");
    expect(provider.providerId).toBe("github.com");
    expect(provider.getScopes()).toEqual(["user:email"]);
});

it.each([
    ["google", "google.com"],
    ["facebook", "facebook.com"],
    ["github", "github.com"]
] as const)(
    "uses the right provider for %s sign-in",
    async (name, providerId) => {
        await signInWithAuthProvider(name, false);
        expect(mocks.signIn).toHaveBeenCalledWith(
            mocks.auth,
            expect.objectContaining({ providerId })
        );
        expect(mocks.signInRedirect).not.toHaveBeenCalled();
    }
);

it("keeps the redirect path on the HTTP development origin", async () => {
    await signInWithAuthProvider("github", true);
    expect(mocks.signInRedirect).toHaveBeenCalledWith(
        mocks.auth,
        expect.objectContaining({ providerId: "github.com" })
    );
    expect(mocks.signIn).not.toHaveBeenCalled();
});

it("reads redirect results on a supported web origin", async () => {
    const result = { operationType: "link", user: mocks.user };
    mocks.redirectResult.mockResolvedValueOnce(result);
    expect(await getAuthProviderRedirectResult()).toBe(result);
    expect(mocks.redirectResult).toHaveBeenCalledWith(mocks.auth);
});

it.each([false, true])(
    "links to the existing UID (redirect: %s)",
    async (redirect) => {
        await connectGitHub(redirect);
        expect(redirect ? mocks.linkRedirect : mocks.link).toHaveBeenCalledWith(
            mocks.user,
            expect.objectContaining({ providerId: "github.com" })
        );
        expect(mocks.signIn).not.toHaveBeenCalled();
        expect(mocks.signInRedirect).not.toHaveBeenCalled();
        expect(mocks.auth.currentUser?.uid).toBe("existing-owner");
    }
);

it("does not create an account when the signed-in session has ended", async () => {
    mocks.auth.currentUser = null;
    await expect(connectGitHub(false)).rejects.toThrow("Sign in before");
    expect(mocks.link).not.toHaveBeenCalled();
    expect(mocks.signIn).not.toHaveBeenCalled();
});

it("does not open another popup when GitHub is already connected", async () => {
    mocks.user.providerData.push({ providerId: "github.com" });
    expect(await connectGitHub(false)).toBe(mocks.user);
    expect(mocks.link).not.toHaveBeenCalled();
});

it("leaves a collision for the user to resolve without signing into a different account", async () => {
    const error = { code: "auth/credential-already-in-use" };
    mocks.link.mockRejectedValueOnce(error);
    await expect(connectGitHub(false)).rejects.toBe(error);
    expect(mocks.auth.currentUser?.uid).toBe("existing-owner");
    expect(mocks.signIn).not.toHaveBeenCalled();
    expect(authErrorMessage(error, "link")).toContain("another IDE account");
});

it("explains how to connect an existing account after an email collision", () => {
    expect(
        authErrorMessage(
            { code: "auth/account-exists-with-different-credential" },
            "signin",
            "github"
        )
    ).toContain('"Connect GitHub" in Edit profile');
});

it("does not suggest connecting GitHub after a Google sign-in collision", () => {
    const message = authErrorMessage(
        { code: "auth/account-exists-with-different-credential" },
        "signin",
        "google"
    );
    expect(message).toContain("method you used before");
    expect(message).not.toContain("GitHub");
});

it("treats cancellation as cancellation, but reports blocked popups", () => {
    expect(authWasCancelled({ code: "auth/popup-closed-by-user" })).toBe(true);
    expect(authWasCancelled({ code: "auth/cancelled-popup-request" })).toBe(
        true
    );
    expect(authWasCancelled({ code: "auth/popup-blocked" })).toBe(false);
    expect(authErrorMessage({ code: "auth/popup-blocked" })).toContain(
        "Allow pop-ups"
    );
});
