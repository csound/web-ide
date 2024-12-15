import React, { useCallback, useState } from "react";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { useDispatch } from "@root/store";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import {
    SET_REQUESTING_STATUS,
    SIGNIN_FAIL,
    SIGNIN_SUCCESS,
    SIGNIN_REQUEST,
    OPEN_DIALOG,
    CLOSE_DIALOG,
    CREATE_USER_FAIL,
    CREATE_USER_SUCCESS,
    CREATE_CLEAR_ERROR,
    LOG_OUT
} from "./types";
import { closeModal, openSimpleModal } from "../modal/actions";
import { database, profiles, usernames } from "../../config/firestore";
import {
    createUserWithEmailAndPassword,
    getAuth,
    sendPasswordResetEmail,
    signInWithEmailAndPassword
} from "firebase/auth";
import { isEmpty } from "lodash";
import { push } from "connected-react-router";
import { openSnackbar } from "../snackbar/actions";
import { SnackbarType } from "../snackbar/types";
import { IProfile } from "../profile/types";

export const login = (
    email: string,
    password: string
): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        dispatch({
            type: SIGNIN_REQUEST
        });

        try {
            const user = await signInWithEmailAndPassword(
                getAuth(),
                email,
                password
            );

            dispatch({
                type: SIGNIN_SUCCESS,
                user
            });
        } catch {
            dispatch({
                type: SIGNIN_FAIL
            });
        }
    };
};

// const profileFinalize = (
//     user: { displayName: string | undefined; uid: string },
//     dispatch: (any) => void
// ): (() => React.ReactElement) => {
//     return
// };

export function ProfileFinalize({
    user
}: {
    user: { displayName: string | undefined; uid: string };
}) {
    const dispatch = useDispatch();
    const [input, setInput] = useState("");
    const [displayName, setDisplayName] = useState(user.displayName || "");
    const [nameReserved, setNameReserved] = useState(false);
    const [bio, setBio] = useState("");
    const [link1, setLink1] = useState("");
    const [link2, setLink2] = useState("");
    const [link3, setLink3] = useState("");

    const checkReservedUsername = async (candidate: string) => {
        const document_ = await getDoc(doc(usernames, candidate));
        setNameReserved(document_.exists());
    };

    const shouldDisable = isEmpty(input) || !/^[\dA-Za-z]+$/.test(input);

    const handleOnSubmit = useCallback(async () => {
        if (!nameReserved) {
            const batch = writeBatch(database);

            const usernameReference = doc(usernames, input);
            const profileReference = doc(profiles, user.uid);
            batch.set(
                usernameReference,
                { userUid: user.uid },
                { merge: true }
            );
            batch.set(
                profileReference,
                {
                    username: input,
                    displayName,
                    bio,
                    link1,
                    link2,
                    link3
                },
                { merge: true }
            );

            try {
                await batch.commit();
                dispatch(closeModal());
                dispatch(
                    openSnackbar("Profile created!", SnackbarType.Success)
                );
                dispatch({
                    type: SIGNIN_SUCCESS,
                    user
                });
            } catch (error) {
                dispatch(
                    openSnackbar(
                        "Could not create profile: " + error,
                        SnackbarType.Error
                    )
                );
            }
        }
    }, [
        dispatch,
        nameReserved,
        input,
        bio,
        displayName,
        link1,
        link2,
        link3,
        user
    ]);

    const textFieldStyle = { marginBottom: 12 };
    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <h2>Almost there...</h2>
            <p>
                Please choose a unique username and tell us something about you
                (if you want to).
                <br />
                You can change this data at anytime, except for your username,
                so choose it carefully.
            </p>
            <TextField
                style={textFieldStyle}
                label={
                    nameReserved ? input + " already exists!" : "New username"
                }
                onChange={(event) => {
                    event.target.value.length < 50 &&
                        setInput(event.target.value);
                    event.target.value.length < 50 &&
                        !isEmpty(event.target.value) &&
                        checkReservedUsername(event.target.value);
                }}
                error={shouldDisable || nameReserved}
                value={input}
            />
            <TextField
                style={textFieldStyle}
                label={"Full name (your display name)"}
                value={displayName || ""}
                onChange={(event) => {
                    event.target.value.length < 50 &&
                        setDisplayName(event.target.value || "");
                }}
            />
            <TextField
                style={textFieldStyle}
                label={"Composer/Artist/Faculty homepage URL"}
                value={link1 || ""}
                onChange={(event) => {
                    setLink1(event.target.value || "");
                }}
            />
            <TextField
                style={textFieldStyle}
                label={"Optional social media URL"}
                value={link2 || ""}
                onChange={(event) => {
                    setLink2(event.target.value || "");
                }}
            />
            <TextField
                style={textFieldStyle}
                label={"Optional social media URL"}
                value={link3 || ""}
                onChange={(event) => {
                    setLink3(event.target.value || "");
                }}
            />
            <TextField
                style={textFieldStyle}
                label={"Bio"}
                value={bio || ""}
                onChange={(event) => {
                    setBio(event.target.value || "");
                }}
                minRows={4}
                multiline={true}
            />
            <Button
                variant="outlined"
                color="primary"
                disabled={shouldDisable || nameReserved}
                onClick={handleOnSubmit}
                style={{ marginTop: 11 }}
            >
                Create Profile
            </Button>
        </div>
    );
}

export const thirdPartyAuthSuccess = (
    user: { uid: string; displayName: string | undefined },
    fromAutoLogin: boolean
): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        let profile;

        try {
            profile = await getDoc(doc(profiles, user.uid));
        } catch (fbError: any) {
            if (
                fbError.name === "FirebaseError" &&
                fbError.code === "unavailable"
            ) {
                dispatch(
                    openSnackbar(
                        "Network error: offline",
                        SnackbarType.Error,
                        5 * 60 * 1000
                    )
                );
            }
            return;
        }

        if (
            profile !== undefined &&
            (!profile.exists ||
                (profile.data() && isEmpty(profile.data()!.username)))
        ) {
            dispatch(
                openSimpleModal("project-finalize", {
                    user
                })
            );
        } else {
            const profileData = profile.data();

            dispatch({
                type: SIGNIN_SUCCESS,
                user
            });
            !fromAutoLogin &&
                profileData &&
                dispatch(push(`/profile/${profileData.username}`));
        }
    };
};

export const openLoginDialog = (): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        dispatch({
            type: OPEN_DIALOG
        });
    };
};

export const closeLoginDialog = (): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        dispatch({
            type: CLOSE_DIALOG
        });
    };
};

export const logOut = (): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        try {
            await getAuth().signOut();
        } catch (error) {
            console.error(error);
        }
        dispatch(push("/"));
        dispatch({
            type: LOG_OUT
        });
    };
};

export const createNewUser = (
    email: string,
    password: string
): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        try {
            const credentials = await createUserWithEmailAndPassword(
                getAuth(),
                email,
                password
            );
            dispatch({
                type: CREATE_USER_SUCCESS,
                credentials
            });
        } catch (error: any) {
            dispatch({
                type: CREATE_USER_FAIL,
                errorCode: error.code,
                errorMessage: error.message
            });
        }
    };
};

export const createUserClearError = (): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        dispatch({
            type: CREATE_CLEAR_ERROR
        });
    };
};

export const setRequestingStatus = (
    status: boolean
): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        dispatch({
            type: SET_REQUESTING_STATUS,
            status
        });
    };
};

export const resetPassword = (email: string) => {
    return async () => {
        await sendPasswordResetEmail(getAuth(), email);
    };
};
