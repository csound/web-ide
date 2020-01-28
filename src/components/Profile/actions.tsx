// import firebase from "firebase/app";
import "firebase/auth";
import { ThunkAction } from "redux-thunk";
import React from "react";
import { Action } from "redux";
// import crypto from "crypto";
import {
    db,
    stars,
    following,
    followers,
    fieldDelete,
    projects,
    profiles,
    usernames,
    tags,
    targets,
    Timestamp
} from "@config/firestore";
import {
    ProfileActionTypes,
    ADD_USER_PROJECT,
    DELETE_USER_PROJECT,
    GET_USER_PROFILE,
    SET_CURRENT_TAG_TEXT,
    SET_TAGS_INPUT,
    GET_TAGS,
    SET_PREVIOUS_PROJECT_TAGS,
    SET_LIST_PLAY_STATE,
    SET_CURRENTLY_PLAYING_PROJECT,
    SET_CSOUND_STATUS,
    REFRESH_USER_PROFILE,
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
import { openSimpleModal } from "@comp/Modal/actions";
import { ProjectModal } from "./ProjectModal";
import { getDeleteProjectModal } from "./DeleteProjectModal";
import {
    selectPreviousProjectTags,
    selectCsoundStatus,
    selectStarProjectRequesting,
    selectLoggedInUserStars
} from "./selectors";
import { playPauseCsound } from "@comp/Csound/actions";
import {
    downloadAllProjectDocumentsOnce,
    downloadProjectOnce
} from "@comp/Projects/actions";
import { getProjectLastModifiedOnce } from "@comp/ProjectLastModified/actions";
import { getPlayActionFromProject } from "@comp/TargetControls/utils";
import { downloadTargetsOnce } from "@comp/TargetControls/actions";
import { ProfileModal } from "./ProfileModal";
import { get } from "lodash";
import { pathOr, assoc, hasPath, pipe } from "ramda";

export const getUserProjects = (
    uid,
    update
): ThunkAction<void, any, null, Action<string>> => async (
    dispatch,
    getState
) => {
    firebase.auth().onAuthStateChanged(async user => {
        const queryResult =
            uid === user?.uid
                ? await projects.where("userUid", "==", uid).get()
                : await projects
                      .where("userUid", "==", uid)
                      .where("public", "==", true)
                      .get();

        const userProjects = queryResult.docs.map(psnap =>
            pipe(
                p => p.data(),
                assoc("projectUid", psnap.id),
                p => assoc("target", p.target || "project.csd", p)
            )(psnap)
        );
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
    projectID: string,
    iconName: string,
    iconForegroundColor: string,
    iconBackgroundColor: string
): ThunkAction<void, any, null, Action<string>> => (dispatch, getState) => {
    firebase.auth().onAuthStateChanged(async user => {
        if (user != null) {
            const newProject = {
                userUid: user.uid,
                name,
                description,
                public: true,
                tags: currentTags,
                iconName,
                iconForegroundColor,
                iconBackgroundColor
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
                const filesWithCsd = await newProjectRef
                    .collection("files")
                    .get();
                const defaultCsdUid = filesWithCsd.docs[0].id;
                await targets.doc(newProjectRef.id).set(
                    {
                        targets: {
                            "project.csd": {
                                csoundOptions: {},
                                targetName: "project.csd",
                                targetType: "main",
                                targetDocumentUid: defaultCsdUid
                            }
                        },
                        defaultTarget: "project.csd"
                    },
                    { merge: true }
                );
                await newProjectRef
                    .collection("files")
                    .add({ ...defaultOrc, userUid: user.uid });
                await newProjectRef
                    .collection("files")
                    .add({ ...defaultSco, userUid: user.uid });
                dispatch(addUserProjectAction());
                dispatch(openSnackbar("Project Added", SnackbarType.Success));
                dispatch(getUserProjects(user.uid, true));
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
    projectID: string,
    iconName: string,
    iconForegroundColor: string,
    iconBackgroundColor: string
): ThunkAction<void, any, null, Action<string>> => (dispatch, getState) => {
    firebase.auth().onAuthStateChanged(async user => {
        if (user !== null) {
            const newProject = {
                userUid: user.uid,
                name: name || "",
                description: description || "",
                public: false,
                tags: currentTags || [],
                iconName: iconName || "",
                iconForegroundColor: iconForegroundColor || "",
                iconBackgroundColor: iconBackgroundColor || ""
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
                dispatch(getUserProjects(user.uid, true));
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
                dispatch(getUserProjects(user.uid, true));
            } catch (e) {
                dispatch(
                    openSnackbar("Could Not Delete Project", SnackbarType.Error)
                );
            }
        }
    });
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

export const getTags = (
    loggedInUser
): ThunkAction<void, any, null, Action<string>> => (dispatch, getStore) => {
    firebase.auth().onAuthStateChanged(async user => {
        if (user != null) {
            tags.onSnapshot(snapshot => {
                const result = snapshot.docs.map(doc => doc.id);
                dispatch({ type: GET_TAGS, payload: result });
            });
        }
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
                    iconName=""
                    iconForegroundColor=""
                    iconBackgroundColor=""
                />
            ))
        );
    };
};

export const followUser = (
    loggedInUserUid: string,
    profileUid: string
): ThunkAction<void, any, null, Action<string>> => async dispatch => {
    const batch = db.batch();
    batch.update(followers.doc(profileUid), {
        [loggedInUserUid]: true
    });
    batch.update(following.doc(loggedInUserUid), {
        [profileUid]: true
    });
    await batch.commit();
};

export const unfollowUser = (
    loggedInUserUid: string,
    profileUid: string
): ThunkAction<void, any, null, Action<string>> => async dispatch => {
    const batch = db.batch();
    batch.update(followers.doc(profileUid), {
        [loggedInUserUid]: fieldDelete()
    });
    batch.update(following.doc(loggedInUserUid), {
        [profileUid]: fieldDelete()
    });
    await batch.commit();
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
                    iconName={project.iconName}
                    iconForegroundColor={project.iconForegroundColor}
                    iconBackgroundColor={project.iconBackgroundColor}
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

export const uploadProfileImage = (
    loggedInUserUid: string,
    file: File
): ThunkAction<void, any, null, Action<string>> => async dispatch => {
    try {
        await firebase
            .storage()
            .ref()
            .child(`images/${loggedInUserUid}/profile.jpeg`)
            .put(file);
        const imageUrl = await firebase
            .storage()
            .ref()
            .child(`images/${loggedInUserUid}/profile.jpeg`)
            .getDownloadURL();
        await profiles.doc(loggedInUserUid).update({ photoUrl: imageUrl });
        dispatch(
            openSnackbar("Profile Picture Uploaded", SnackbarType.Success)
        );
    } catch (e) {
        dispatch(
            openSnackbar("Profile Picture Upload Failed", SnackbarType.Error)
        );
    }
};

export const playListItem = (
    projectUid: string | false
): ThunkAction<void, any, null, Action<string>> => async (
    dispatch,
    getState
) => {
    const state = getState();
    const csound = state.csound.csound;
    const csoundStatus = selectCsoundStatus(state);
    if (projectUid === false) {
        console.log("playListItem: projectUid is false");
        return;
    }
    if (csoundStatus === "paused") {
        dispatch(playPauseCsound());
        dispatch({ type: SET_LIST_PLAY_STATE, payload: "playing" });
    } else {
        const projectIsCached = hasPath(
            ["ProjectsReducer", "projects", projectUid],
            state
        );
        const projectHasLastMod = hasPath(
            ["ProjectLastModifiedReducer", projectUid, "timestamp"],
            state
        );
        let timestampMismatch = false;

        if (projectIsCached && projectHasLastMod) {
            const cachedTimestamp: Timestamp | null = pathOr(
                null,
                [
                    "ProjectsReducer",
                    "projects",
                    projectUid,
                    "cachedProjectLastModified"
                ],
                state
            );
            const currentTimestamp: Timestamp | null = pathOr(
                null,
                ["ProjectLastModifiedReducer", projectUid, "timestamp"],
                state
            );
            if (cachedTimestamp && currentTimestamp) {
                timestampMismatch =
                    (cachedTimestamp as Timestamp).toMillis() !==
                    (currentTimestamp as Timestamp).toMillis();
            }
        }

        if (!projectIsCached || timestampMismatch || !projectHasLastMod) {
            await downloadProjectOnce(projectUid)(dispatch);
            await downloadAllProjectDocumentsOnce(projectUid, csound)(dispatch);
            await downloadTargetsOnce(projectUid)(dispatch);
            await getProjectLastModifiedOnce(projectUid)(dispatch);
            // recursion
            return playListItem(projectUid)(dispatch, getState, null);
        }

        const playAction = getPlayActionFromProject(projectUid, state);
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
        } else {
            // handle unplayable project
        }
    }
};

export const pauseListItem = (
    projectUid: string | false
): ThunkAction<void, any, null, Action<string>> => (dispatch, getState) => {
    dispatch({ type: SET_LIST_PLAY_STATE, payload: "paused" });

    dispatch(playPauseCsound());
};

export const getUserProfileAction = (payload: any): ProfileActionTypes => {
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

            const projectStars = get(project.data(), "stars") || [];
            const starsKeys =
                projectStars.map(e => get(Object.keys(e), "0")) || [];
            const currentStars = selectLoggedInUserStars(state);

            if (starsKeys.includes(user.uid) === true) {
                const index = starsKeys.indexOf(user.uid);
                const starToRemove = projectStars[index];

                currentStars.splice(currentStars.indexOf(projectUid), 1);
                dispatch({
                    type: GET_LOGGED_IN_USER_STARS,
                    payload: currentStars
                });

                await stars.doc(projectUid).set(
                    {
                        stars: firebase.firestore.FieldValue.arrayRemove(
                            starToRemove
                        )
                    },
                    { merge: true }
                );

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

                const date = Date.now();
                await stars.doc(projectUid).update({
                    stars: firebase.firestore.FieldValue.arrayUnion({
                        [user.uid]: date
                    })
                });
                await projects.doc(projectUid).update({
                    stars: firebase.firestore.FieldValue.arrayUnion({
                        [user.uid]: date
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
