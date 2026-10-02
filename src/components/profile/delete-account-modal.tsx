import { ProfileDialog } from "./profile-dialog";
import React, { useState } from "react";
import { useDispatch } from "@root/store";
import { closeModal } from "@comp/modal/actions";
import { TextField, Button, CircularProgress, Typography } from "@mui/material";
import {
    getAuth,
    signOut,
    EmailAuthProvider,
    reauthenticateWithCredential,
    reauthenticateWithPopup,
    GoogleAuthProvider,
    FacebookAuthProvider
} from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { openSnackbar } from "@comp/snackbar/actions";
import { SnackbarType } from "@comp/snackbar/types";
import { navigateTo } from "@comp/router/navigate";

type Step = "confirm" | "reauth";

const functions = getFunctions();
const deleteAccount = httpsCallable<void, { success: boolean }>(
    functions,
    "delete_account"
);

export function DeleteAccountModal({ username }: { username: string }) {
    const [nameInput, setNameInput] = useState("");
    const [password, setPassword] = useState("");
    const [step, setStep] = useState<Step>("confirm");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const dispatch = useDispatch();

    const user = getAuth().currentUser;
    const providers = user?.providerData.map((p) => p.providerId) ?? [];
    const isEmailProvider = providers.includes("password");
    const isGoogleProvider = providers.includes("google.com");
    const isFacebookProvider = providers.includes("facebook.com");

    const performDelete = async () => {
        if (!user) return;
        setLoading(true);
        setError("");
        try {
            await deleteAccount();
            await signOut(getAuth());
            dispatch(openSnackbar("Account Deleted", SnackbarType.Success));
            dispatch(closeModal());
            navigateTo("/");
        } catch (error: unknown) {
            const errorCode =
                error instanceof Error && "code" in error
                    ? String(error.code)
                    : "";

            const details =
                error instanceof Error && "details" in error
                    ? error.details
                    : undefined;
            if (
                errorCode === "auth/requires-recent-login" ||
                (errorCode === "functions/failed-precondition" &&
                    details &&
                    typeof details === "object" &&
                    "reason" in details &&
                    details.reason === "requires-recent-login")
            ) {
                setStep("reauth");
            } else {
                setError("Could not delete account. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const reauthWithPassword = async () => {
        setError("");
        if (!user) {
            setError("No authenticated user found.");
            return;
        }

        const currentEmail = user?.email;

        if (!currentEmail) {
            setError("Password re-authentication is unavailable.");
            return;
        }

        try {
            const credential = EmailAuthProvider.credential(
                currentEmail,
                password
            );

            await reauthenticateWithCredential(user, credential);
            await user.getIdToken(true);
            await performDelete();
        } catch {
            setError("Incorrect password. Please try again.");
        }
    };

    const reauthWithProvider = async (
        provider: GoogleAuthProvider | FacebookAuthProvider
    ) => {
        setError("");
        if (!user) {
            setError("No authenticated user found.");
            return;
        }

        try {
            await reauthenticateWithPopup(user, provider);
            await user.getIdToken(true);
            await performDelete();
        } catch {
            setError("Re-authentication failed. Please try again.");
        }
    };

    if (step === "reauth") {
        return (
            <ProfileDialog
                title="Confirm your identity"
                width={440}
                actions={
                    <Button
                        color="inherit"
                        disabled={loading}
                        onClick={() => dispatch(closeModal())}
                    >
                        Cancel
                    </Button>
                }
            >
                <Typography variant="body2">
                    For security, please verify it&apos;s you before deleting
                    your account.
                </Typography>
                {isEmailProvider && (
                    <>
                        <TextField
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            fullWidth
                            autoFocus
                            onKeyDown={(e) =>
                                e.key === "Enter" && reauthWithPassword()
                            }
                            style={{ marginBottom: 12 }}
                        />
                        <Button
                            variant="outlined"
                            color="error"
                            fullWidth
                            disabled={!password || loading}
                            onClick={reauthWithPassword}
                            startIcon={
                                loading ? (
                                    <CircularProgress size={16} />
                                ) : undefined
                            }
                        >
                            Confirm &amp; Delete Account
                        </Button>
                    </>
                )}
                {isGoogleProvider && (
                    <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        disabled={loading}
                        onClick={() =>
                            reauthWithProvider(new GoogleAuthProvider())
                        }
                        style={{ marginTop: 8 }}
                    >
                        Continue with Google &amp; Delete
                    </Button>
                )}
                {isFacebookProvider && (
                    <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        disabled={loading}
                        onClick={() =>
                            reauthWithProvider(new FacebookAuthProvider())
                        }
                        style={{ marginTop: 8 }}
                    >
                        Continue with Facebook &amp; Delete
                    </Button>
                )}
                {error && (
                    <Typography
                        color="error"
                        variant="body2"
                        style={{ marginTop: 8 }}
                    >
                        {error}
                    </Typography>
                )}
            </ProfileDialog>
        );
    }

    return (
        <ProfileDialog
            title="Delete Account"
            width={440}
            actions={
                <>
                    <Button
                        color="inherit"
                        disabled={loading}
                        onClick={() => dispatch(closeModal())}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={performDelete}
                        disabled={nameInput !== username || loading}
                        startIcon={
                            loading ? <CircularProgress size={16} /> : undefined
                        }
                    >
                        Delete Account
                    </Button>
                </>
            }
        >
            <Typography variant="body2">
                This will permanently delete your account and all associated
                data. This cannot be undone.
            </Typography>
            <TextField
                label="Type your username to confirm"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                fullWidth
                autoFocus
            />
            {error && (
                <Typography
                    color="error"
                    variant="body2"
                    style={{ marginTop: 8 }}
                >
                    {error}
                </Typography>
            )}
        </ProfileDialog>
    );
}

export default DeleteAccountModal;
