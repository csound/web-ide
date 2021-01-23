import { ThunkAction } from "redux-thunk";
import React from "react";
import { Action } from "redux";
import {
    database,
    following,
    followers,
    fieldDelete,
    getFirebaseTimestamp,
    projects,
    profiles,
    profileStars,
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
    STORE_PROFILE_PROJECTS_COUNT,
    STORE_PROFILE_STARS,
    SET_CURRENT_TAG_TEXT,
    SET_TAGS_INPUT,
    GET_ALL_TAGS,
    SET_CURRENTLY_PLAYING_PROJECT,
    REFRESH_USER_PROFILE,
    SET_FOLLOWING_FILTER_STRING,
    SET_PROJECT_FILTER_STRING
} from "./types";
import { defaultCsd, defaultOrc, defaultSco } from "@root/templates";
import firebase from "firebase/app";
import "firebase/auth";
import { openSnackbar } from "@comp/snackbar/actions";
import { SnackbarType } from "@comp/snackbar/types";
import { openSimpleModal } from "@comp/modal/actions";
import { ProjectModal } from "./project-modal";
import { getDeleteProjectModal } from "./delete-project-modal";
import { selectLoggedInUid } from "@comp/login/selectors";
import { selectCurrentlyPlayingProject } from "./selectors";
import {
    downloadAllProjectDocumentsOnce,
    downloadProjectOnce
} from "@comp/projects/actions";
import { getProjectLastModifiedOnce } from "@comp/project-last-modified/actions";
import { getPlayActionFromProject } from "@comp/target-controls/utils";
import { downloadTargetsOnce } from "@comp/target-controls/actions";
import { ProfileModal } from "./profile-modal";
import {
    assoc,
    concat,
    difference,
    equals,
    keys,
    reject,
    path,
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
    const currentProjTagsReference = await tags
        .where(projectUid, "==", loggedInUserUid)
        .get();
    const currentProjTags = currentProjTagsReference.docs.reduce(
        (accumulator, document_) =>
            assoc(document_.id, document_.data(), accumulator),
        {}
    );
    const newTags = reject(
        (t) => keys(currentProjTags).some((ts) => ts === t),
        currentTags
    );
    const deletedTags = difference(
        keys(currentProjTags).sort(),
        currentTags.sort()
    );

    const batch = database.batch();
    await Promise.all(
        newTags.map(async (newTag) => {
            batch.set(
                tags.doc(newTag),
                { [projectUid]: loggedInUserUid },
                { merge: true }
            );
        })
    );
    await Promise.all(
        deletedTags.map(async (delTag) => {
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
            created: getFirebaseTimestamp(),
            description,
            public: true,
            iconName,
            iconForegroundColor,
            iconBackgroundColor
        };

        try {
            const batch = database.batch();
            const newProjectReference = projects.doc();
            batch.set(newProjectReference, newProject);
            const filesReference = newProjectReference.collection("files");
            const csdFileReference = filesReference.doc();
            batch.set(csdFileReference, {
                ...defaultCsd,
                userUid: loggedInUserUid
            });
            batch.set(filesReference.doc(), {
                ...defaultOrc,
                userUid: loggedInUserUid
            });
            batch.set(filesReference.doc(), {
                ...defaultSco,
                userUid: loggedInUserUid
            });
            batch.set(
                targets.doc(newProjectReference.id),
                {
                    targets: {
                        "project.csd": {
                            csoundOptions: {},
                            targetName: "project.csd",
                            targetType: "main",
                            targetDocumentUid: csdFileReference.id
                        }
                    },
                    defaultTarget: "project.csd"
                },
                { merge: true }
            );
            await batch.commit();
            await handleProjectTags(
                newProjectReference.id,
                loggedInUserUid,
                currentTags
            );
            dispatch(addUserProjectAction());
            dispatch(openSnackbar("Project Added", SnackbarType.Success));
        } catch (error) {
            console.log(error);
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
            const newProjectReference = await projects.doc(projectUid);
            await newProjectReference.update(newProject);
            await handleProjectTags(projectUid, loggedInUserUid, currentTags);
            dispatch(addUserProjectAction());
            dispatch(openSnackbar("Project modified", SnackbarType.Success));
        } catch (error) {
            console.log(error);
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
    document_: any
): ThunkAction<void, any, null, Action<string>> => async (
    dispatch,
    getState
) => {
    const currentState = getState();
    const loggedInUserUid = selectLoggedInUid(currentState);
    if (loggedInUserUid) {
        const files = await projects
            .doc(document_.projectUid)
            .collection("files")
            .get();

        const batch = database.batch();
        const documentReference = projects.doc(document_.projectUid);
        batch.delete(documentReference);
        files.forEach((d) => batch.delete(d.ref));

        try {
            await batch.commit();
            setTimeout(() => dispatch(deleteUserProjectAction()), 1);

            dispatch(openSnackbar("Project Deleted", SnackbarType.Success));
        } catch {
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
            (accumulator, item) => concat(item.tags || [], accumulator),
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
                    iconName={undefined}
                    iconForegroundColor={undefined}
                    iconBackgroundColor={undefined}
                />
            ))
        );
    };
};

export const followUser = (
    loggedInUserUid: string,
    profileUid: string
): ThunkAction<void, any, null, Action<string>> => async (dispatch) => {
    const batch = database.batch();
    const followersReference = followers.doc(profileUid);
    const followersData = await followersReference.get();

    if (followersData.exists) {
        batch.update(followersReference, {
            [loggedInUserUid]: getFirebaseTimestamp()
        });
    } else {
        batch.set(followersReference, {
            [loggedInUserUid]: getFirebaseTimestamp()
        });
    }

    const followingReference = following.doc(loggedInUserUid);
    const followingData = await followingReference.get();
    if (followingData.exists) {
        batch.update(followingReference, {
            [profileUid]: getFirebaseTimestamp()
        });
    } else {
        batch.set(followingReference, {
            [profileUid]: getFirebaseTimestamp()
        });
    }

    await batch.commit();
};

export const unfollowUser = (
    loggedInUserUid: string,
    profileUid: string
): ThunkAction<void, any, null, Action<string>> => async (dispatch) => {
    const batch = database.batch();
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
    link3: string,
    backgroundIndex: number
): ThunkAction<void, any, null, Action<string>> => async (
    dispatch,
    getState
) => {
    const currentState = getState();
    const loggedInUserUid = selectLoggedInUid(currentState);
    if (loggedInUserUid) {
        await profiles.doc(loggedInUserUid).update({
            username,
            displayName,
            bio,
            link1,
            link2,
            link3,
            backgroundIndex
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
    link3: string,
    backgroundIndex: number
) => {
    return async (dispatch: any, getState) => {
        const currentState = getState();
        const loggedInUserUid = selectLoggedInUid(currentState);
        if (loggedInUserUid) {
            const names = await usernames.get();
            const existingNames: string[] = [];
            names.forEach((name) => {
                if (name.id !== username) {
                    existingNames.push(name.id);
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
                        backgroundIndex={backgroundIndex}
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

export const deleteProject = (document_: any) => {
    return async (dispatch: any) => {
        const DeleteProjectModal = getDeleteProjectModal(document_);
        dispatch(openSimpleModal(DeleteProjectModal));
    };
};

export const uploadProfileImage = (
    loggedInUserUid: string,
    file: File
): ThunkAction<void, any, null, Action<string>> => async (dispatch) => {
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
    } catch {
        dispatch(
            openSnackbar("Profile Picture Upload Failed", SnackbarType.Error)
        );
    }
};

export const playListItem = (projectUid: string | false) => async (
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
            projectUid: undefined
        });
    }

    const projectIsCached = hasPath(
        ["ProjectsReducer", "projects", projectUid],
        state
    );
    const projectHasLastModule = hasPath(
        ["ProjectLastModifiedReducer", projectUid, "timestamp"],
        state
    );
    let timestampMismatch = false;

    if (projectIsCached && projectHasLastModule) {
        const cachedTimestamp: Timestamp | undefined = path(
            [
                "ProjectsReducer",
                "projects",
                projectUid,
                "cachedProjectLastModified"
            ],
            state
        );
        const currentTimestamp: Timestamp | undefined = path(
            ["ProjectLastModifiedReducer", projectUid, "timestamp"],
            state
        );
        if (cachedTimestamp && currentTimestamp) {
            timestampMismatch =
                (cachedTimestamp as Timestamp).toMillis() !==
                (currentTimestamp as Timestamp).toMillis();
        }
    }

    if (!projectIsCached || timestampMismatch || !projectHasLastModule) {
        await downloadProjectOnce(projectUid)(dispatch);
        await downloadAllProjectDocumentsOnce(projectUid, csound)(dispatch);
        await downloadTargetsOnce(projectUid)(dispatch);
        await getProjectLastModifiedOnce(projectUid)(dispatch);
        // recursion
        return playListItem(projectUid)(dispatch, getState);
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

export const storeProfileProjectsCount = (
    projectsCount: any,
    profileUid: string
) => {
    return {
        type: STORE_PROFILE_PROJECTS_COUNT,
        projectsCount,
        profileUid
    };
};

export const storeUserProfile = (profile: any, profileUid: string) => {
    return {
        type: STORE_USER_PROFILE,
        profile,
        profileUid
    };
};

export const storeProfileStars = (stars: any, profileUid: string) => {
    return {
        type: STORE_PROFILE_STARS,
        profileUid,
        stars
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
        if (!projectUid || !loggedInUserUid) {
            return;
        }
        const batch = database.batch();
        const currentProjectStarsReference = await stars.doc(projectUid).get();
        const currentProjectStars = currentProjectStarsReference.exists
            ? currentProjectStarsReference.data()
            : {};
        const currentlyStarred = keys(currentProjectStars || []).includes(
            loggedInUserUid
        );

        if (!currentlyStarred) {
            batch.set(
                stars.doc(projectUid),
                { [loggedInUserUid]: getFirebaseTimestamp() },
                { merge: true }
            );
            batch.set(
                profileStars.doc(loggedInUserUid),
                { [projectUid]: getFirebaseTimestamp() },
                { merge: true }
            );
        } else {
            batch.update(stars.doc(projectUid), {
                [loggedInUserUid]: fieldDelete()
            });
            batch.update(profileStars.doc(loggedInUserUid), {
                [projectUid]: fieldDelete()
            });
        }
        await batch.commit();
    };
};
