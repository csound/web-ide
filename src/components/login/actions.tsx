import React, { useCallback, useState } from "react";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { AppThunk, useDispatch, useSelector } from "@root/store";
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
    LOG_OUT,
    LoginDialogMode,
    PostAuthFlow,
    SET_POST_AUTH_FLOW
} from "./types";
import { closeModal, openSimpleModal } from "../modal/actions";
import { database, profiles, usernames } from "../../config/firestore";
import {
    FacebookAuthProvider,
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    getAuth,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect
} from "firebase/auth";
import { isEmpty } from "lodash";
import { openSnackbar } from "../snackbar/actions";
import { SnackbarType } from "../snackbar/types";
import { IProfile } from "../profile/types";
import { navigateTo } from "@comp/router/navigate";
import { isElectron } from "@root/utils";
import { selectPostAuthFlow } from "./selectors";

const openProjectCreationModal = () =>
    openSimpleModal("new-project-prompt", {
        name: "New Project",
        description: "",
        label: "Create Project",
        newProject: true,
        projectID: "",
        starterTemplate: "single-csd",
        iconName: undefined,
        iconForegroundColor: undefined,
        iconBackgroundColor: undefined
    });

export const login = (email: string, password: string): AppThunk => {
    return async (dispatch) => {
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
        } catch (error: any) {
            dispatch({
                type: SIGNIN_FAIL,
                errorCode: error.code,
                errorMessage: error.message
            });
        }
    };
};

export const loginWithProvider = (
    providerName: "google" | "facebook"
): AppThunk => {
    return async (dispatch) => {
        dispatch({
            type: SIGNIN_REQUEST
        });

        const provider =
            providerName === "google"
                ? new GoogleAuthProvider()
                : new FacebookAuthProvider();

        try {
            if (isElectron) {
                await signInWithRedirect(getAuth(), provider);
            } else {
                await signInWithPopup(getAuth(), provider);
            }
        } catch (error: any) {
            dispatch({
                type: SIGNIN_FAIL,
                errorCode: error.code,
                errorMessage: error.message
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
    const postAuthFlow = useSelector(selectPostAuthFlow);
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
                    link3,
                    themeName:
                        localStorage.getItem("theme") === "monokai"
                            ? "default"
                            : localStorage.getItem("theme") || "default"
                },
                { merge: true }
            );

            try {
                await batch.commit();
                dispatch(
                    openSnackbar("Profile created!", SnackbarType.Success)
                );
                dispatch({
                    type: SIGNIN_SUCCESS,
                    user
                });

                if (postAuthFlow === "create-project") {
                    dispatch(setPostAuthFlow(undefined));
                    dispatch(openProjectCreationModal());
                } else {
                    dispatch(closeModal());
                }
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
): AppThunk => {
    return async (dispatch, getState) => {
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
            const postAuthFlow = selectPostAuthFlow(getState());

            dispatch({
                type: SIGNIN_SUCCESS,
                user
            });

            if (!fromAutoLogin && postAuthFlow === "create-project") {
                dispatch(setPostAuthFlow(undefined));
                dispatch(openProjectCreationModal());
                return;
            }

            !fromAutoLogin &&
                profileData &&
                navigateTo(`/profile/${profileData.username}`);
        }
    };
};

export const setPostAuthFlow = (postAuthFlow: PostAuthFlow): AppThunk => {
    return async (dispatch) => {
        dispatch({
            type: SET_POST_AUTH_FLOW,
            postAuthFlow
        });
    };
};

export const openLoginDialog = (
    dialogMode: LoginDialogMode = "login"
): AppThunk => {
    return async (dispatch) => {
        dispatch({
            type: OPEN_DIALOG,
            dialogMode
        });
    };
};

export const closeLoginDialog = (): AppThunk => {
    return async (dispatch) => {
        dispatch({
            type: CLOSE_DIALOG
        });
    };
};

export const logOut = (): AppThunk => {
    return async (dispatch) => {
        try {
            await getAuth().signOut();
        } catch (error) {
            console.error(error);
        }
        navigateTo("/");
        dispatch({
            type: LOG_OUT
        });
    };
};

export const createNewUser = (email: string, password: string): AppThunk => {
    return async (dispatch) => {
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

export const createUserClearError = (): AppThunk => {
    return async (dispatch) => {
        dispatch({
            type: CREATE_CLEAR_ERROR
        });
    };
};

export const setRequestingStatus = (status: boolean): AppThunk => {
    return async (dispatch) => {
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
