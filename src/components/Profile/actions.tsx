import "firebase/auth";
import { ThunkAction } from "redux-thunk";
import React from "react";
import { Action } from "redux";
import {
    db,
    following,
    followers,
    fieldDelete,
    getFirebaseTimestamp,
    projects,
    profiles,
    usernames,
    stars,
    tags,
    targets,
    Timestamp
} from "@config/firestore";
import {
    ProfileActionTypes,
    ADD_USER_PROJECT,
    DELETE_USER_PROJECT,
    STORE_USER_PROFILE,
    SET_CURRENT_TAG_TEXT,
    SET_TAGS_INPUT,
    GET_ALL_TAGS,
    // SET_LIST_PLAY_STATE,
    SET_CURRENTLY_PLAYING_PROJECT,
    REFRESH_USER_PROFILE,
    SET_FOLLOWING_FILTER_STRING,
    SET_PROJECT_FILTER_STRING
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
import { selectLoggedInUid } from "@comp/Login/selectors";
import { selectCurrentlyPlayingProject } from "./selectors";
import {
    downloadAllProjectDocumentsOnce,
    downloadProjectOnce
} from "@comp/Projects/actions";
import { getProjectLastModifiedOnce } from "@comp/ProjectLastModified/actions";
import { getPlayActionFromProject } from "@comp/TargetControls/utils";
import { downloadTargetsOnce } from "@comp/TargetControls/actions";
import { ProfileModal } from "./ProfileModal";
import {
    assoc,
    concat,
    difference,
    equals,
    keys,
    reject,
    pathOr,
    hasPath,
    reduce
} from "ramda";

const addUserProjectAction = (): ProfileActionTypes => {
    return {
        type: ADD_USER_PROJECT
    };
};

const handleProjectTags = async (projectUid, loggedInUserUid, currentTags) => {
    const currentProjTagsRef = await tags
        .where(projectUid, "==", loggedInUserUid)
        .get();
    const currentProjTags = currentProjTagsRef.docs.reduce(
        (acc, doc) => assoc(doc.id, doc.data(), acc),
        {}
    );
    const newTags = reject(
        t => keys(currentProjTags).some(ts => ts === t),
        currentTags
    );
    const deletedTags = difference(
        keys(currentProjTags).sort(),
        currentTags.sort()
    );

    const batch = db.batch();
    await Promise.all(
        newTags.map(async newTag => {
            batch.set(
                tags.doc(newTag),
                { [projectUid]: loggedInUserUid },
                { merge: true }
            );
        })
    );
    await Promise.all(
        deletedTags.map(async delTag => {
            const tagData = (await tags.doc(delTag).get()).data();
            if (
                tagData &&
                keys(tagData).length === 1 &&
                keys(tagData)[0] === projectUid
            ) {
                batch.delete(tags.doc(delTag));
            } else if (tagData && keys(tagData).length > 0) {
                batch.update(tags.doc(delTag), { [projectUid]: fieldDelete() });
            }
        })
    );
    await batch.commit();
};

export const addUserProject = (
    name: string,
    description: string,
    currentTags: string[],
    projectUid: string,
    iconName: string,
    iconForegroundColor: string,
    iconBackgroundColor: string
): ThunkAction<void, any, null, Action<string>> => async (
    dispatch,
    getState
) => {
    const currentState = getState();
    const loggedInUserUid = selectLoggedInUid(currentState);
    if (loggedInUserUid) {
        const newProject = {
            userUid: loggedInUserUid,
            name,
            description,
            public: true,
            iconName,
            iconForegroundColor,
            iconBackgroundColor
        };

        try {
            const newProjectRef = await projects.add(newProject);
            await newProjectRef
                .collection("files")
                .add({ ...defaultCsd, userUid: loggedInUserUid });
            const filesWithCsd = await newProjectRef.collection("files").get();
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
                .add({ ...defaultOrc, userUid: loggedInUserUid });
            await newProjectRef
                .collection("files")
                .add({ ...defaultSco, userUid: loggedInUserUid });
            await handleProjectTags(projectUid, loggedInUserUid, currentTags);
            dispatch(addUserProjectAction());
            dispatch(openSnackbar("Project Added", SnackbarType.Success));
        } catch (e) {
            console.log(e);
            dispatch(openSnackbar("Could not add Project", SnackbarType.Error));
        }
    }
};

export const editUserProject = (
    name: string,
    description: string,
    currentTags: string[],
    projectUid: string,
    iconName: string,
    iconForegroundColor: string,
    iconBackgroundColor: string
): ThunkAction<void, any, null, Action<string>> => async (
    dispatch,
    getState
) => {
    const currentState = getState();
    const loggedInUserUid = selectLoggedInUid(currentState);
    if (loggedInUserUid) {
        const newProject = {
            userUid: loggedInUserUid,
            name: name || "",
            description: description || "",
            public: false,
            iconName: iconName || "",
            iconForegroundColor: iconForegroundColor || "",
            iconBackgroundColor: iconBackgroundColor || ""
        };

        try {
            const newProjectRef = await projects.doc(projectUid);
            await newProjectRef.update(newProject);
            await handleProjectTags(projectUid, loggedInUserUid, currentTags);
            dispatch(addUserProjectAction());
            dispatch(openSnackbar("Project modified", SnackbarType.Success));
        } catch (e) {
            console.log(e);

            dispatch(
                openSnackbar("Could not edit Project", SnackbarType.Error)
            );
        }
    }
};

const deleteUserProjectAction = (): ProfileActionTypes => {
    return {
        type: DELETE_USER_PROJECT
    };
};

export const deleteUserProject = (
    doc: any
): ThunkAction<void, any, null, Action<string>> => async (
    dispatch,
    getState
) => {
    const currentState = getState();
    const loggedInUserUid = selectLoggedInUid(currentState);
    if (loggedInUserUid != null) {
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
};

export const setCurrentTagText = (text: string): ProfileActionTypes => {
    return {
        type: SET_CURRENT_TAG_TEXT,
        payload: text
    };
};

export const setTagsInput = (tags): ProfileActionTypes => {
    return {
        type: SET_TAGS_INPUT,
        payload: tags
    };
};

export const getAllTagsFromUser = (
    loggedInUserUid,
    allUserProjectsUids
): ThunkAction<void, any, null, Action<string>> => async (
    dispatch,
    getStore
) => {
    const store = getStore();

    const currentAllTags = pathOr(
        {},
        ["ProfiledReducer", "profiles", loggedInUserUid, "allTags"],
        store
    );

    if (allUserProjectsUids) {
        const allTags = reduce(
            (acc, item) => concat(item.tags || [], acc),
            [],
            allUserProjectsUids
        );
        // console.log();
        if (!equals(currentAllTags, allTags)) {
            dispatch({ type: GET_ALL_TAGS, allTags, loggedInUserUid });
        }
    }
};

export const addProject = () => {
    return async (dispatch: any) => {
        dispatch(
            openSimpleModal(() => (
                <ProjectModal
                    name={"New Project"}
                    description={""}
                    label={"Create Project"}
                    newProject={true}
                    projectID=""
                    iconName={null}
                    iconForegroundColor={null}
                    iconBackgroundColor={null}
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
    const followersRef = followers.doc(profileUid);
    const followersData = await followersRef.get();

    if (followersData.exists) {
        batch.update(followersRef, {
            [loggedInUserUid]: true
        });
    } else {
        batch.set(followersRef, {
            [loggedInUserUid]: true
        });
    }

    const followingRef = following.doc(loggedInUserUid);
    const followingData = await followingRef.get();
    if (followingData.exists) {
        batch.update(followingRef, {
            [profileUid]: true
        });
    } else {
        batch.set(followingRef, {
            [profileUid]: true
        });
    }

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

export const updateUserProfile = (
    originalUsername: string,
    username: string,
    displayName: string,
    bio: string,
    link1: string,
    link2: string,
    link3: string
): ThunkAction<void, any, null, Action<string>> => async (
    dispatch,
    getState
) => {
    const currentState = getState();
    const loggedInUserUid = selectLoggedInUid(currentState);
    if (loggedInUserUid != null) {
        await profiles.doc(loggedInUserUid).update({
            username,
            displayName,
            bio,
            link1,
            link2,
            link3
        });

        await usernames.doc(originalUsername).delete();
        await usernames.doc(username).set({ userUid: loggedInUserUid });
        dispatch({
            type: REFRESH_USER_PROFILE,
            payload: { username, displayName, bio, link1, link2, link3 }
        });
    }
};

export const editProfile = (
    username: string,
    displayName: string,
    bio: string,
    link1: string,
    link2: string,
    link3: string
) => {
    return async (dispatch: any, getState) => {
        const currentState = getState();
        const loggedInUserUid = selectLoggedInUid(currentState);
        if (loggedInUserUid != null) {
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
                    />
                ))
            );
        }
    };
};

export const editProject = (project: any) => {
    return async (dispatch: any) => {
        dispatch(
            openSimpleModal(() => (
                <ProjectModal
                    name={project.name}
                    description={project.description}
                    label={"Apply changes"}
                    projectID={project.projectUid}
                    iconName={project.iconName}
                    iconForegroundColor={project.iconForegroundColor}
                    iconBackgroundColor={project.iconBackgroundColor}
                    newProject={false}
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
    const currentlyPlayingProject = selectCurrentlyPlayingProject(state);

    if (projectUid === false) {
        console.log("playListItem: projectUid is false");
        return;
    }

    if (projectUid !== currentlyPlayingProject) {
        await dispatch({
            type: SET_CURRENTLY_PLAYING_PROJECT,
            projectUid: null
        });
    }

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
        dispatch(playAction);
        await dispatch({
            type: SET_CURRENTLY_PLAYING_PROJECT,
            projectUid
        });
    } else {
        // handle unplayable project
    }
};

export const pauseListItem = (
    projectUid: string | false
): ThunkAction<void, any, null, Action<string>> => (dispatch, getState) => {
    // dispatch({ type: SET_LIST_PLAY_STATE, payload: "paused" });
    // dispatch(playCSDFromEMFS());
};

export const storeUserProfile = (profile: any, profileUid: string) => {
    return {
        type: STORE_USER_PROFILE,
        profile,
        profileUid
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

export const starOrUnstarProject = (
    projectUid: string,
    loggedInUserUid: string
) => {
    return async () => {
        if (!projectUid || !loggedInUserUid) return;
        const currentProjectStarsRef = await stars.doc(projectUid).get();
        const currentProjectStars = currentProjectStarsRef.exists
            ? currentProjectStarsRef.data()
            : {};
        const currentlyStarred = keys(currentProjectStars || []).includes(
            loggedInUserUid
        );

        if (!currentlyStarred) {
            stars
                .doc(projectUid)
                .set(
                    { [loggedInUserUid]: getFirebaseTimestamp() },
                    { merge: true }
                );
        } else {
            stars.doc(projectUid).update({ [loggedInUserUid]: fieldDelete() });
        }
    };
};
