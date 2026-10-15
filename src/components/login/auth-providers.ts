import {
    type AuthProvider,
    type User,
    FacebookAuthProvider,
    GithubAuthProvider,
    GoogleAuthProvider,
    getAuth,
    getRedirectResult,
    linkWithPopup,
    linkWithRedirect,
    reauthenticateWithPopup,
    signInWithPopup,
    signInWithRedirect
} from "firebase/auth";
import { FirebaseError } from "firebase/app";

export type ProviderName = "google" | "github" | "facebook";

export const providerAuthUnavailableMessage =
    "Provider sign-in is unavailable in this desktop build. Open ide.csound.com in your browser.";

// Packaged Electron loads file://, even when its renderer has no process object.
// Neither Firebase popups nor redirects can authenticate from that origin.
export const supportsProviderAuth = () =>
    ["http:", "https:"].includes(window.location.protocol);

const requireProviderAuthOrigin = () => {
    if (!supportsProviderAuth()) {
        throw new FirebaseError(
            "auth/operation-not-supported-in-this-environment",
            providerAuthUnavailableMessage
        );
    }
};

export async function getAuthProviderRedirectResult() {
    return supportsProviderAuth() ? getRedirectResult(getAuth()) : null;
}

export async function reauthenticateWithAuthProvider(
    user: User,
    provider: AuthProvider
) {
    requireProviderAuthOrigin();
    return reauthenticateWithPopup(user, provider);
}

export const authProviders: { name: ProviderName; label: string }[] = [
    { name: "google", label: "Google" },
    { name: "github", label: "GitHub" },
    { name: "facebook", label: "Facebook" }
];

export function createAuthProvider(name: ProviderName) {
    switch (name) {
        case "google": {
            return new GoogleAuthProvider();
        }
        case "github": {
            // Firebase needs an email even when it is private on GitHub.
            return new GithubAuthProvider().addScope("user:email");
        }
        case "facebook": {
            return new FacebookAuthProvider();
        }
    }
}

export async function signInWithAuthProvider(
    name: ProviderName,
    redirect: boolean
) {
    requireProviderAuthOrigin();
    const provider = createAuthProvider(name);
    return redirect
        ? signInWithRedirect(getAuth(), provider)
        : signInWithPopup(getAuth(), provider);
}

export async function connectGitHub(redirect: boolean) {
    const user = getAuth().currentUser;
    if (!user) {
        throw new Error("Sign in before connecting GitHub.");
    }
    if (
        user.providerData.some(({ providerId }) => providerId === "github.com")
    ) {
        return user;
    }
    requireProviderAuthOrigin();
    const provider = createAuthProvider("github");
    // Link to the signed-in UID. Signing in here would switch accounts and
    // could leave the user's existing projects on a different account.
    if (redirect) {
        await linkWithRedirect(user, provider);
        return;
    }
    return (await linkWithPopup(user, provider)).user;
}

export const authErrorCode = (error: unknown): string =>
    error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "";

export const authWasCancelled = (error: unknown): boolean =>
    ["auth/popup-closed-by-user", "auth/cancelled-popup-request"].includes(
        authErrorCode(error)
    );

export function authErrorMessage(
    error: unknown,
    action: "signin" | "link" = "signin",
    provider?: ProviderName
): string {
    switch (authErrorCode(error)) {
        case "auth/operation-not-supported-in-this-environment": {
            return providerAuthUnavailableMessage;
        }
        case "auth/account-exists-with-different-credential": {
            return provider === "github"
                ? 'This email already has an account. Sign in with your usual method, then choose "Connect GitHub" in Edit profile.'
                : "This email already has an account. Sign in with the method you used before.";
        }
        case "auth/credential-already-in-use": {
            return action === "link"
                ? "This GitHub account is already connected to another IDE account. Sign in to that account, or choose a different GitHub account."
                : "This sign-in method is already connected to another IDE account. Sign in to that account, or choose a different account.";
        }
        case "auth/email-already-in-use": {
            return "This email belongs to another IDE account. Sign in to that account with the method you used before.";
        }
        case "auth/popup-blocked": {
            return "Your browser blocked the sign-in window. Allow pop-ups for this site and try again.";
        }
        case "auth/network-request-failed": {
            return "Could not reach the sign-in service. Check your connection and try again.";
        }
        case "auth/operation-not-allowed": {
            return "This sign-in method is not enabled yet. Please use another method.";
        }
        case "auth/user-disabled": {
            return "This account has been disabled. Please contact support.";
        }
        default: {
            return action === "link"
                ? "Could not connect GitHub. Please try again."
                : "Could not sign in. Please try again.";
        }
    }
}
