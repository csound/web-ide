// import firebase from "firebase/app";
import "firebase/auth";
import { ThunkAction } from "redux-thunk";
import React from "react";
import { Action } from "redux";
// import crypto from "crypto";
import { db, projects, profiles, usernames, tags } from "@config/firestore";
import {
    GET_USER_PROJECTS,
    ProfileActionTypes,
    ADD_USER_PROJECT,
    DELETE_USER_PROJECT,
    GET_USER_PROFILE,
    GET_USER_IMAGE_URL,
    SET_CURRENT_TAG_TEXT,
    SET_TAGS_INPUT,
    GET_TAGS,
    SET_PREVIOUS_PROJECT_TAGS,
    SET_LIST_PLAY_STATE,
    SET_CURRENTLY_PLAYING_PROJECT,
    SET_CSOUND_STATUS,
    SHOULD_REDIRECT_REQUEST,
    SHOULD_REDIRECT_YES,
    SHOULD_REDIRECT_NO,
    REFRESH_USER_PROFILE,
    GET_USER_FOLLOWING,
    GET_USER_PROFILES_FOR_FOLLOWING,
    GET_LOGGED_IN_USER_FOLLOWING,
    SET_IMAGE_URL_REQUESTING,
    SET_PROFILE_REQUESTING,
    SET_FOLLOWING_FILTER_STRING,
    SET_PROJECT_FILTER_STRING,
    SET_STAR_PROJECT_REQUESTING,
    GET_LOGGED_IN_USER_STARS
} from "./types";
import defaultCsd from "@root/templates/DefaultCsd.json";
import defaultOrc from "@root/templates/DefaultOrc.json";
import defaultSco from "@root/templates/DefaultSco.json";
import firebase from "firebase/app";
import { openSnackbar } from "@comp/Snackbar/actions";
import { SnackbarType } from "@comp/Snackbar/types";
import { push } from "connected-react-router";
import { openSimpleModal } from "@comp/Modal/actions";
import { ProjectModal } from "./ProjectModal";
import { getDeleteProjectModal } from "./DeleteProjectModal";
import {
    selectPreviousProjectTags,
    selectCsoundStatus,
    selectUserFollowing,
    selectStarProjectRequesting,
    selectLoggedInUserStars
} from "./selectors";
import { playPauseCsound } from "@comp/Csound/actions";
import {
    loadProjectFromFirestore,
    syncProjectDocumentsWithEMFS
} from "@comp/Projects/actions";
import { getPlayActionFromProject } from "@comp/TargetControls/utils";
import { ProfileModal } from "./ProfileModal";
import { get } from "lodash";
import { assoc, hasPath, pipe } from "ramda";
import { IStore } from "@root/store/types";

const getUserProjectsAction = (payload: any): ProfileActionTypes => {
    return {
        type: GET_USER_PROJECTS,
        payload
    };
};

export const getUserProjects = (
    uid
): ThunkAction<void, any, null, Action<string>> => async (dispatch, getState) => {
    dispatch(getUserProjectsAction([]));
    firebase.auth().onAuthStateChanged(async user => {
        const store:IStore = getState();
        const queryResult = (uid == user?.uid) ? 
            await projects.where("userUid", "==", uid).get() :
            await projects.where("userUid", "==", uid).where("public", "==", true).get();

        const userProjects = queryResult.docs.map(psnap =>
            pipe(
                p => p.data(),
                assoc("projectUid", psnap.id),
                p => assoc("target", p.target || "project.csd", p)
            )(psnap)
        );
        dispatch(getUserProjectsAction(userProjects));

            });
};

const addUserProjectAction = (): ProfileActionTypes => {
    return {
        type: ADD_USER_PROJECT
    };
};

export const addUserProject = (
    name: string,
    description: string,
    currentTags: string[],
    projectID: string
): ThunkAction<void, any, null, Action<string>> => (dispatch, getState) => {
    firebase.auth().onAuthStateChanged(async user => {
        if (user != null) {
            const newProject = {
                userUid: user.uid,
                name,
                description,
                public: true,
                tags: currentTags
            };

            try {
                const newProjectRef = await projects.add(newProject);
                const tagsResult = currentTags.map(async tag => {
                    const result = await tags.doc(tag).get();
                    if (result.exists) {
                        return tags.doc(tag).update({
                            projectUids: firebase.firestore.FieldValue.arrayUnion(
                                newProjectRef.id
                            )
                        });
                    } else {
                        return tags.doc(tag).set({
                            projectUids: firebase.firestore.FieldValue.arrayUnion(
                                newProjectRef.id
                            )
                        });
                    }
                });
                await Promise.all(tagsResult);
                await newProjectRef
                    .collection("files")
                    .add({ ...defaultCsd, userUid: user.uid });
                await newProjectRef
                    .collection("files")
                    .add({ ...defaultOrc, userUid: user.uid });
                await newProjectRef
                    .collection("files")
                    .add({ ...defaultSco, userUid: user.uid });
                dispatch(addUserProjectAction());
                dispatch(openSnackbar("Project Added", SnackbarType.Success));
            } catch (e) {
                console.log(e);

                dispatch(
                    openSnackbar("Could not add Project", SnackbarType.Error)
                );
            }
        }
    });
};

export const editUserProject = (
    name: string,
    description: string,
    currentTags: string[],
    projectID: string
): ThunkAction<void, any, null, Action<string>> => (dispatch, getState) => {
    firebase.auth().onAuthStateChanged(async user => {
        if (user !== null) {
            const newProject = {
                userUid: user.uid,
                name: name || "",
                description: description || "",
                public: false,
                tags: currentTags || []
            };

            const state = getState();
            const previousProjectTags = selectPreviousProjectTags(state);
            const deletedTags = previousProjectTags.filter(
                e => !currentTags.includes(e)
            );

            try {
                const newProjectRef = await projects.doc(projectID);

                let tagsResult = deletedTags.map(async tag => {
                    const result = await tags.doc(tag).get();
                    if (result.exists) {
                        return tags.doc(tag).update({
                            projectUids: firebase.firestore.FieldValue.arrayRemove(
                                newProjectRef.id
                            )
                        });
                    }
                });
                await Promise.all(tagsResult);

                tagsResult = deletedTags.map(async tag => {
                    const result = await tags.doc(tag).get();
                    const obj = result.data() || {
                        projectUids: []
                    };

                    if (obj.projectUids.length === 0) {
                        await tags.doc(tag).delete();
                    }
                });
                await Promise.all(tagsResult);

                tagsResult = currentTags.map(async tag => {
                    const result = await tags.doc(tag).get();
                    if (result.exists) {
                        return tags.doc(tag).update({
                            projectUids: firebase.firestore.FieldValue.arrayUnion(
                                newProjectRef.id
                            )
                        });
                    } else {
                        return tags.doc(tag).set({
                            projectUids: firebase.firestore.FieldValue.arrayUnion(
                                newProjectRef.id
                            )
                        });
                    }
                });
                await newProjectRef.update(newProject);
                dispatch(addUserProjectAction());
                dispatch(openSnackbar("Project Edited", SnackbarType.Success));
            } catch (e) {
                console.log(e);

                dispatch(
                    openSnackbar("Could not edit Project", SnackbarType.Error)
                );
            }
        }
    });
};

const deleteUserProjectAction = (): ProfileActionTypes => {
    return {
        type: DELETE_USER_PROJECT
    };
};

export const deleteUserProject = (
    doc: any
): ThunkAction<void, any, null, Action<string>> => dispatch => {
    firebase.auth().onAuthStateChanged(async user => {
        if (user != null) {
            const files = await projects
                .doc(doc.projectUid)
                .collection("files")
                .get();

            const batch = db.batch();
            const docRef = projects.doc(doc.projectUid);
            batch.delete(docRef);
            files.forEach(d => batch.delete(d.ref));

            try {
                await batch.commit();
                setTimeout(() => dispatch(deleteUserProjectAction()), 1);

                dispatch(openSnackbar("Project Deleted", SnackbarType.Success));
            } catch (e) {
                dispatch(
                    openSnackbar("Could Not Delete Project", SnackbarType.Error)
                );
            }
        }
    });
};

export const getUserImageURLAction = (
    url: string | null
): ProfileActionTypes => {
    return {
        type: GET_USER_IMAGE_URL,
        payload: url
    };
};

export const setCurrentTagText = (text: string): ProfileActionTypes => {
    return {
        type: SET_CURRENT_TAG_TEXT,
        payload: text
    };
};

export const setTagsInput = (tags: any[]): ProfileActionTypes => {
    return {
        type: SET_TAGS_INPUT,
        payload: tags
    };
};

export const setCsoundStatus = (
    status: string
): ThunkAction<void, any, null, Action<string>> => (dispatch, getStore) => {
    const state = getStore();
    const csoundStatus = selectCsoundStatus(state);

    if (status !== csoundStatus) {
        dispatch({
            type: SET_CSOUND_STATUS,
            payload: status
        });
    }
};

export const getTags = (): ThunkAction<void, any, null, Action<string>> => (
    dispatch,
    getStore
) => {
    firebase.auth().onAuthStateChanged(async user => {
        if (user != null) {
            tags.onSnapshot(snapshot => {
                const result = snapshot.docs.map(doc => doc.id);
                dispatch({ type: GET_TAGS, payload: result });
            });
        }
    });
};

export const getUserImageURL = (
    username: string
): ThunkAction<void, any, null, Action<string>> => (dispatch, getStore) => {
    dispatch({ type: SET_IMAGE_URL_REQUESTING, payload: true });
    firebase.auth().onAuthStateChanged(async user => {
        let imageUrl: string | null = null;
        let profileUid: string | null = null;
        let profile: any | null = null;
        let photoUrl: string | null = null;
        // let email: string | null = null;
        if (username === null && user !== null) {
            profileUid = user.uid;
            profile = await profiles.doc(profileUid!).get();
            photoUrl = get(profile.data(), "photoUrl") || null;
        } else if (username !== null) {
            const result = await usernames.doc(username).get();

            if (result.data() !== null) {
                profileUid = get(result.data(), "userUid") || null;
                if (profileUid !== null) {
                    profile = await profiles.doc(profileUid!).get();
                    photoUrl = get(profile.data(), "photoUrl") || null;
                    // email = get(profile.data(), "email") || null;
                }
            }
        }

        if (profileUid !== null) {
            try {
                imageUrl = await firebase
                    .storage()
                    .ref()
                    .child(`images/${profileUid}/profile.jpeg`)
                    .getDownloadURL();
                dispatch(getUserImageURLAction(imageUrl!));
                dispatch({ type: SET_IMAGE_URL_REQUESTING, payload: false });

                return;
            } catch (e) {
                imageUrl = null;
            }
        }

        if (imageUrl === null && photoUrl !== null) {
            dispatch(getUserImageURLAction(photoUrl!));
            dispatch({ type: SET_IMAGE_URL_REQUESTING, payload: false });

            return;
        }

        dispatch(getUserImageURLAction(null));
        dispatch({ type: SET_IMAGE_URL_REQUESTING, payload: false });

        // if (imageUrl === null && photoUrl === null) {
        //     try {
        //         const md5Email = crypto
        //             .createHash("md5")
        //             .update("example@email.com")
        //             .digest("hex");
        //         imageUrl = `https://www.gravatar.com/avatar/${md5Email}?s=2048`;
        //         const response = await fetch(`${imageUrl}?d=404`);

        //         dispatch(getUserImageURLAction(imageUrl));
        //         return;
        //     } catch (e) {
        //         console.log("no gravatar");
        //     }
        // }
    });
};

export const addProject = () => {
    return async (dispatch: any) => {
        dispatch(
            openSimpleModal(() => (
                <ProjectModal
                    name={"New Project"}
                    description={""}
                    projectAction={addUserProject}
                    label={"Create"}
                    projectID=""
                />
            ))
        );
    };
};

export const followUser = (
    username: string
): ThunkAction<void, any, null, Action<string>> => (dispatch, getState) => {
    firebase.auth().onAuthStateChanged(async user => {
        if (user !== null) {
            const state = getState();
            const userFollowing: String[] = selectUserFollowing(state);
            userFollowing.push(username);
            dispatch({
                type: GET_USER_FOLLOWING,
                payload: [...new Set(userFollowing)]
            });
            await profiles.doc(user.uid).update({
                following: firebase.firestore.FieldValue.arrayUnion(username)
            });
            dispatch(getLoggedInUserFollowing());
        }
    });
};

export const unfollowUser = (
    username: string
): ThunkAction<void, any, null, Action<string>> => (dispatch, getState) => {
    firebase.auth().onAuthStateChanged(async user => {
        if (user !== null) {
            const state = getState();
            const userFollowing: String[] = selectUserFollowing(state);
            dispatch({
                type: GET_USER_FOLLOWING,
                payload: userFollowing.filter(e => e !== username)
            });
            await profiles.doc(user.uid).update({
                following: firebase.firestore.FieldValue.arrayRemove(username)
            });
            dispatch(getLoggedInUserFollowing());
        }
    });
};

export const getUserProfilesForFollowing = (
    userProfiles: string[]
): ThunkAction<void, any, null, Action<string>> => dispatch => {
    firebase.auth().onAuthStateChanged(async user => {
        if (user !== null) {
            const result = userProfiles.map(async username => {
                const result = await usernames.doc(username).get();
                const profileUid = get(result.data(), "userUid") || null;
                const profile = await profiles.doc(profileUid!).get();
                let imageUrl;
                try {
                    imageUrl = await firebase
                        .storage()
                        .ref()
                        .child(`images/${profileUid}/profile.jpeg`)
                        .getDownloadURL();
                } catch (e) {
                    imageUrl = null;
                }

                if (imageUrl === null) {
                    imageUrl = get(profile.data(), "photoUrl") || null;
                }

                const profileData = profile.data();
                profileData!.imageUrl = imageUrl;
                return profileData;
            });

            const followingProfiles = await Promise.all(result);
            dispatch({
                type: GET_USER_PROFILES_FOR_FOLLOWING,
                payload: followingProfiles
            });
        }
    });
};

export const getUserFollowing = (
    username: string | null
): ThunkAction<void, any, null, Action<string>> => async dispatch => {
    dispatch({
        type: GET_USER_FOLLOWING,
        payload: []
    });
    if (username === null) {
        firebase.auth().onAuthStateChanged(async user => {
            if (user !== null) {
                const profile = await profiles.doc(user.uid).get();
                const profileData = profile.data();
                const following = get(profileData, "following") || [];

                dispatch({
                    type: GET_USER_FOLLOWING,
                    payload: following
                });
            }
        });
    } else {
        const result = await usernames.doc(username).get();
        const profileUid = get(result.data(), "userUid") || null;

        if (profileUid !== null) {
            const profile = await profiles.doc(profileUid!).get();
            const profileData = profile.data();
            const following = get(profileData, "following") || [];

            dispatch({
                type: GET_USER_FOLLOWING,
                payload: following
            });
        }
    }
};

export const getLoggedInUserFollowing = (): ThunkAction<
    void,
    any,
    null,
    Action<string>
> => dispatch => {
    firebase.auth().onAuthStateChanged(async user => {
        if (user !== null) {
            const profile = await profiles.doc(user.uid).get();
            const profileData = profile.data();
            const following = get(profileData, "following") || [];

            dispatch({
                type: GET_LOGGED_IN_USER_FOLLOWING,
                payload: following
            });
        }
    });
};

export const setUserProfile = (
    originalUsername: string,
    username: string,
    displayName: string,
    bio: string,
    link1: string,
    link2: string,
    link3: string
): ThunkAction<void, any, null, Action<string>> => dispatch => {
    firebase.auth().onAuthStateChanged(async user => {
        if (user != null) {
            await profiles.doc(user.uid).update({
                username,
                displayName,
                bio,
                link1,
                link2,
                link3
            });

            await usernames.doc(originalUsername).delete();
            await usernames.doc(username).set({ userUid: user.uid });
            dispatch({
                type: REFRESH_USER_PROFILE,
                payload: { username, displayName, bio, link1, link2, link3 }
            });
        }
    });
};

export const editProfile = (
    username: string,
    displayName: string,
    bio: string,
    link1: string,
    link2: string,
    link3: string
) => {
    return async (dispatch: any) => {
        firebase.auth().onAuthStateChanged(async user => {
            if (user != null) {
                const names = await usernames.get();
                const existingNames: string[] = [];
                names.forEach(e => {
                    if (e.id !== username) {
                        existingNames.push(e.id);
                    }
                });

                dispatch(
                    openSimpleModal(() => (
                        <ProfileModal
                            existingNames={existingNames}
                            username={username}
                            displayName={displayName}
                            bio={bio}
                            link1={link1}
                            link2={link2}
                            link3={link3}
                            profileAction={setUserProfile}
                        />
                    ))
                );
            }
        });
    };
};

export const editProject = (project: any) => {
    return async (dispatch: any) => {
        dispatch({ type: SET_TAGS_INPUT, payload: project.tags || [] });
        dispatch({
            type: SET_PREVIOUS_PROJECT_TAGS,
            payload: project.tags || []
        });
        dispatch(
            openSimpleModal(() => (
                <ProjectModal
                    name={project.name}
                    description={project.description}
                    projectAction={editUserProject}
                    label={"Edit"}
                    projectID={project.projectUid}
                />
            ))
        );
    };
};

export const deleteProject = (doc: any) => {
    return async (dispatch: any) => {
        const DeleteProjectModal = getDeleteProjectModal(doc);
        dispatch(openSimpleModal(DeleteProjectModal));
    };
};

export const uploadImage = (
    file: File
): ThunkAction<void, any, null, Action<string>> => dispatch => {
    firebase.auth().onAuthStateChanged(async user => {
        if (user != null) {
            try {
                await firebase
                    .storage()
                    .ref()
                    .child(`images/${user.uid}/profile.jpeg`)
                    .put(file);
                const imageUrl = await firebase
                    .storage()
                    .ref()
                    .child(`images/${user.uid}/profile.jpeg`)
                    .getDownloadURL();

                dispatch(getUserImageURLAction(imageUrl));
                dispatch(
                    openSnackbar(
                        "Profile Picture Uploaded",
                        SnackbarType.Success
                    )
                );
            } catch (e) {
                dispatch(
                    openSnackbar(
                        "Profile Picture Upload Failed",
                        SnackbarType.Error
                    )
                );
            }
        }
    });
};

export const playListItem = (
    projectUid: string | false
): ThunkAction<void, any, null, Action<string>> => (dispatch, getState) => {
    const state = getState();

    const csoundStatus = selectCsoundStatus(state);

    if (projectUid === false) {
        console.log("playListItem: projectUid is false");
        return;
    }

    if (csoundStatus === "paused") {
        dispatch(playPauseCsound());
        dispatch({ type: SET_LIST_PLAY_STATE, payload: "playing" });
    } else {
        if (hasPath(["ProjectsReducer", "projects", projectUid], state)) {
            const playAction = getPlayActionFromProject(state, projectUid);
            if (playAction) {
                dispatch({
                    type: SET_LIST_PLAY_STATE,
                    payload: "playing"
                });
                dispatch(playAction);
                dispatch({
                    type: SET_CSOUND_STATUS,
                    payload: false
                });
                dispatch({
                    type: SET_CURRENTLY_PLAYING_PROJECT,
                    payload: projectUid
                });
            }
        } else {
            loadProjectFromFirestore(projectUid)(dispatch).then(() => {
                dispatch(
                    syncProjectDocumentsWithEMFS(projectUid, () => {
                        const playAction = getPlayActionFromProject(
                            state,
                            projectUid
                        );
                        if (playAction) {
                            dispatch({
                                type: SET_LIST_PLAY_STATE,
                                payload: "playing"
                            });
                            dispatch(playAction);
                            dispatch({
                                type: SET_CSOUND_STATUS,
                                payload: false
                            });
                            dispatch({
                                type: SET_CURRENTLY_PLAYING_PROJECT,
                                payload: projectUid
                            });
                        }
                    })
                );
            });
        }
    }
};

export const pauseListItem = (
    projectUid: string | false
): ThunkAction<void, any, null, Action<string>> => (dispatch, getState) => {
    dispatch({ type: SET_LIST_PLAY_STATE, payload: "paused" });

    dispatch(playPauseCsound());
};

export const getUserProfile = (
    username: string
): ThunkAction<void, any, null, Action<string>> => (dispatch, getState) => {
    dispatch({ type: SHOULD_REDIRECT_REQUEST });
    dispatch({ type: SET_PROFILE_REQUESTING, payload: true });
    firebase.auth().onAuthStateChanged(async user => {
        if (username !== null) {
            const result = await usernames.doc(username).get();
            if (result.data() === null) {
                dispatch(push("/404", { message: "User not found." }));
                dispatch({ type: SET_PROFILE_REQUESTING, payload: false });
                return;
            } else {
                dispatch({ type: SHOULD_REDIRECT_NO });
                const result = await usernames.doc(username).get();
                const data = result.data() || null;

                if (data === null) {
                    dispatch(push("/404", { message: "Profile Not Found" }));
                    dispatch({ type: SET_PROFILE_REQUESTING, payload: false });

                    return;
                }

                const profileUid = data!.userUid;
                const loggedInUid = user ? user!.uid : null;

                if (profileUid) {
                    const profile = await profiles.doc(profileUid).get();

                    if (!profile.exists) {
                        dispatch(push("/404"));
                        dispatch({
                            type: SET_PROFILE_REQUESTING,
                            payload: false
                        });

                        openSnackbar(
                            "User profile not found",
                            SnackbarType.Error
                        );
                    } else {
                        dispatch(
                            getUserProfileAction({
                                profile: profile.data(),
                                loggedInUid,
                                profileUid
                            })
                        );
                        dispatch({
                            type: SET_PROFILE_REQUESTING,
                            payload: false
                        });
                    }
                } else {
                    dispatch(push("/404"));
                    dispatch({ type: SET_PROFILE_REQUESTING, payload: false });

                    openSnackbar("User profile not found", SnackbarType.Error);
                }
            }
        }
        if (user !== null) {
            if (username === null) {
                dispatch({ type: SHOULD_REDIRECT_NO });
                const loggedInUid = user!.uid;
                const profile = await profiles.doc(loggedInUid).get();

                if (!profile.exists) {
                    dispatch(push("/404"));
                    dispatch({ type: SET_PROFILE_REQUESTING, payload: false });
                    openSnackbar("User profile not found", SnackbarType.Error);
                } else {
                    dispatch(
                        getUserProfileAction({
                            profile: profile.data(),
                            loggedInUid,
                            profileUid: loggedInUid
                        })
                    );
                    dispatch({ type: SET_PROFILE_REQUESTING, payload: false });
                }
            }
        } else if (user === null) {
            if (username === null) {
                dispatch({ type: SHOULD_REDIRECT_YES });
                dispatch(push("/"));
                dispatch({ type: SET_PROFILE_REQUESTING, payload: false });
            }
        }
    });
};

const getUserProfileAction = (payload: any): ProfileActionTypes => {
    return {
        type: GET_USER_PROFILE,
        payload
    };
};

export const setProjectFilterString = (payload: string): ProfileActionTypes => {
    return {
        type: SET_PROJECT_FILTER_STRING,
        payload
    };
};

export const setFollowingFilterString = (
    payload: string
): ProfileActionTypes => {
    return {
        type: SET_FOLLOWING_FILTER_STRING,
        payload
    };
};

export const getLoggedInUserStars = (): ThunkAction<
    void,
    any,
    null,
    Action<string>
> => dispatch => {
    firebase.auth().onAuthStateChanged(async user => {
        if (user !== null) {
            const profile = await profiles.doc(user.uid).get();
            const stars = get(profile.data(), "stars") || [];

            dispatch({
                type: GET_LOGGED_IN_USER_STARS,
                payload: stars
            });
        }
    });
};

export const toggleStarProject = (
    projectUid: string
): ThunkAction<void, any, null, Action<string>> => (dispatch, getState) => {
    const state = getState();
    const starProjectRequesting = selectStarProjectRequesting(state);

    if (starProjectRequesting.includes(projectUid) === true) {
        return;
    }

    firebase.auth().onAuthStateChanged(async user => {
        starProjectRequesting.push(projectUid);
        dispatch({
            type: SET_STAR_PROJECT_REQUESTING,
            payload: starProjectRequesting
        });
        if (user !== null) {
            const project = await projects.doc(projectUid).get();

            const stars = get(project.data(), "stars") || [];
            const starsKeys = stars.map(e => get(Object.keys(e), "0")) || [];
            const currentStars = selectLoggedInUserStars(state);

            if (starsKeys.includes(user.uid) === true) {
                const index = starsKeys.indexOf(user.uid);
                const starToRemove = stars[index];

                currentStars.splice(currentStars.indexOf(projectUid), 1);
                dispatch({
                    type: GET_LOGGED_IN_USER_STARS,
                    payload: currentStars
                });

                await projects.doc(projectUid).update({
                    stars: firebase.firestore.FieldValue.arrayRemove(
                        starToRemove
                    )
                });
                await profiles.doc(user.uid).update({
                    stars: firebase.firestore.FieldValue.arrayRemove(projectUid)
                });
            } else {
                currentStars.push(projectUid);
                dispatch({
                    type: GET_LOGGED_IN_USER_STARS,
                    payload: currentStars
                });

                await projects.doc(projectUid).update({
                    stars: firebase.firestore.FieldValue.arrayUnion({
                        [user.uid]: Date.now()
                    })
                });
                await profiles.doc(user.uid).update({
                    stars: firebase.firestore.FieldValue.arrayUnion(projectUid)
                });
            }

            starProjectRequesting.splice(
                starProjectRequesting.indexOf(projectUid),
                1
            );

            dispatch({
                type: SET_STAR_PROJECT_REQUESTING,
                payload: starProjectRequesting
            });

            dispatch(getLoggedInUserStars());
        }
    });
};
