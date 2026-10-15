import { useEffect, useRef, useState } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import CheckIcon from "@mui/icons-material/Check";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import {
    authErrorMessage,
    authWasCancelled,
    connectGitHub
} from "@comp/login/auth-providers";
import { isElectron } from "@root/utils";

const accountSnapshot = (user: User | null) =>
    user
        ? {
              uid: user.uid,
              connected: user.providerData.some(
                  ({ providerId }) => providerId === "github.com"
              )
          }
        : undefined;

export function GitHubConnection() {
    const [account, setAccount] = useState(() =>
        accountSnapshot(getAuth().currentUser)
    );
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState("");
    const pending = useRef(false);
    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;
        const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
            setAccount(accountSnapshot(user));
            setError("");
        });
        return () => {
            mounted.current = false;
            unsubscribe();
        };
    }, []);

    const connect = async () => {
        if (pending.current || !account) return;
        const uid = account.uid;
        pending.current = true;
        setConnecting(true);
        setError("");
        try {
            const user = await connectGitHub(isElectron);
            if (mounted.current && user && getAuth().currentUser?.uid === uid) {
                setAccount(accountSnapshot(user));
            }
        } catch (error: unknown) {
            if (
                mounted.current &&
                getAuth().currentUser?.uid === uid &&
                !authWasCancelled(error)
            ) {
                setError(authErrorMessage(error, "link"));
            }
        } finally {
            pending.current = false;
            if (mounted.current) setConnecting(false);
        }
    };

    if (!account) return null;

    return (
        <Box sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
            <Typography component="h3" variant="subtitle2" sx={{ mb: 1 }}>
                Sign-in methods
            </Typography>
            {account.connected ? (
                <Typography
                    role="status"
                    variant="body2"
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                    <CheckIcon fontSize="small" /> GitHub connected
                </Typography>
            ) : (
                <>
                    <Typography variant="body2" sx={{ mb: 1.5 }}>
                        Use GitHub to sign in to this account. Your projects
                        stay here. Connecting saves right away.
                    </Typography>
                    {isElectron && (
                        <Typography variant="body2" sx={{ mb: 1.5 }}>
                            Save any profile edits first. Connecting will leave
                            this page and return after sign-in.
                        </Typography>
                    )}
                    <Button
                        variant="outlined"
                        disabled={connecting}
                        onClick={connect}
                        startIcon={
                            connecting ? (
                                <CircularProgress size={16} color="inherit" />
                            ) : (
                                <GitHubIcon />
                            )
                        }
                    >
                        {connecting ? "Connecting…" : "Connect GitHub"}
                    </Button>
                </>
            )}
            {error && (
                <Typography
                    role="alert"
                    color="error"
                    variant="body2"
                    sx={{ mt: 1 }}
                >
                    {error}
                </Typography>
            )}
        </Box>
    );
}
