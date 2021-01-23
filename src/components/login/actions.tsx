import React, { useState } from "react";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import { DebounceInput } from "react-debounce-input";
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
import firebase from "firebase/app";
import "firebase/auth";
import { isEmpty } from "lodash";
import { push } from "connected-react-router";
import { openSnackbar } from "../snackbar/actions";
import { SnackbarType } from "../snackbar/types";

export const login = (email: string, password: string) => {
    return async (dispatch: any) => {
        dispatch({
            type: SIGNIN_REQUEST
        });

        try {
            const user = await firebase
                .auth()
                .signInWithEmailAndPassword(email, password);
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

function DebounceCuston(properties: any) {
    const { inputRef, ...other } = properties;

    return (
        <DebounceInput
            {...other}
            ref={(reference: any) => {
                inputRef(reference && reference.inputElement);
            }}
        />
    );
}

const profileFinalize = (user: any, dispatch: any) => {
    return (() => {
        const [input, setInput] = useState("");
        const [displayName, setDisplayName] = useState(user.displayName || "");
        const [nameReserved, setNameReserved] = useState(false);
        const [bio, setBio] = useState("");
        const [link1, setLink1] = useState("");
        const [link2, setLink2] = useState("");
        const [link3, setLink3] = useState("");

        const checkReservedUsername = (candidate: string) => {
            usernames
                .doc(candidate)
                .get()
                .then((document_) => setNameReserved(document_.exists));
        };

        const shouldDisable = isEmpty(input) || !/^[\dA-Za-z]+$/.test(input);

        const handleOnSubmit = async () => {
            if (!nameReserved) {
                const batch = database.batch();

                const usernameReference = usernames.doc(input);
                const profileReference = profiles.doc(user.uid);
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
        };

        const textFieldStyle = { marginBottom: 12 };
        return (
            <div style={{ display: "flex", flexDirection: "column" }}>
                <h2>Almost there...</h2>
                <p>
                    Please choose a unique username and tell us something about
                    you (if you want to).
                    <br />
                    You can change this data at anytime, except for your
                    username, so choose it carefully.
                </p>
                <TextField
                    style={textFieldStyle}
                    label={
                        nameReserved
                            ? input + " already exists!"
                            : "New username"
                    }
                    InputProps={{ inputComponent: DebounceCuston as any }}
                    error={shouldDisable || nameReserved}
                    value={input}
                    onChange={(event) => {
                        event.target.value.length < 50 &&
                            setInput(event.target.value);
                        event.target.value.length < 50 &&
                            !isEmpty(event.target.value) &&
                            checkReservedUsername(event.target.value);
                    }}
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
                    rows={4}
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
    }) as React.FC;
};

export const thirdPartyAuthSuccess = (user: any, fromAutoLogin: boolean) => {
    return async (dispatch: any) => {
        let profile;

        try {
            profile = await profiles.doc(user.uid).get();
        } catch (fbError) {
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
            (!profile.exists || isEmpty(profile.data()!.username))
        ) {
            const profileFinalizeComp = profileFinalize(user, dispatch);
            dispatch(openSimpleModal(profileFinalizeComp));
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

export const openLoginDialog = () => {
    return async (dispatch: any) => {
        dispatch({
            type: OPEN_DIALOG
        });
    };
};

export const closeLoginDialog = () => {
    return async (dispatch: any) => {
        dispatch({
            type: CLOSE_DIALOG
        });
    };
};

export const logOut = () => {
    return async (dispatch: any) => {
        try {
            await firebase.auth().signOut();
        } catch (error) {
            console.error(error);
        }
        dispatch(push("/"));
        dispatch({
            type: LOG_OUT
        });
    };
};

export const createNewUser = (email: string, password: string) => {
    return async (dispatch: any) => {
        firebase
            .auth()
            .createUserWithEmailAndPassword(email, password)
            .then((creditendials: any) => {
                dispatch({
                    type: CREATE_USER_SUCCESS,
                    creditendials
                });
            })
            .catch((error: any) => {
                dispatch({
                    type: CREATE_USER_FAIL,
                    errorCode: error.code,
                    errorMessage: error.message
                });
            });
    };
};

export const createUserClearError = () => {
    return async (dispatch: any) => {
        dispatch({
            type: CREATE_CLEAR_ERROR
        });
    };
};

export const setRequestingStatus = (status: boolean) => {
    return async (dispatch: any) => {
        dispatch({
            type: SET_REQUESTING_STATUS,
            status
        });
    };
};

export const resetPassword = (email: string) => {
    return async (dispatch: any) => {
        firebase.auth().sendPasswordResetEmail(email);
    };
};
