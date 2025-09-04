import { AppThunkDispatch, RootState } from "@root/store";
import { getDownloadURL, uploadBytes } from "firebase/storage";
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    writeBatch
} from "firebase/firestore";
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
    Timestamp,
    storageReference
} from "@config/firestore";
import {
    ProjectsCount,
    IProfile,
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
import { defaultCsd, defaultOrc, defaultSco } from "@root/csound-templates";
import { openSnackbar } from "@comp/snackbar/actions";
import { SnackbarType } from "@comp/snackbar/types";
import { openSimpleModal } from "@comp/modal/actions";
import { selectLoggedInUid } from "@comp/login/selectors";
import { selectCurrentlyPlayingProject } from "./selectors";
import {
    downloadAllProjectDocumentsOnce,
    downloadProjectOnce
} from "@comp/projects/actions";
import { getProjectLastModifiedOnce } from "@comp/project-last-modified/actions";
import {
    getPlayActionFromProject,
    getPlayActionFromTarget
} from "@comp/target-controls/utils";
import { downloadTargetsOnce } from "@comp/target-controls/actions";
import { IProject } from "@comp/projects/types";
import { assoc, difference, keys, path, hasPath } from "ramda";

const addUserProjectAction = (): ProfileActionTypes => {
    return {
        type: ADD_USER_PROJECT
    };
};

const handleProjectTags = async (
    projectUid: string,
    loggedInUserUid: string,
    currentTags: string[]
) => {
    const currentProjTagsReference = await getDocs(
        query(tags, where(projectUid, "==", loggedInUserUid))
    );

    const currentProjTags = currentProjTagsReference.docs.reduce(
        (accumulator, document_) =>
            assoc(document_.id, document_.data(), accumulator),
        {}
    );
    const newTags = currentTags.filter(
        (t) => !Object.keys(currentProjTags).includes(t)
    );

    const deletedTags = difference(
        keys(currentProjTags).sort(),
        currentTags.sort()
    );

    const batch = writeBatch(database);
    await Promise.all(
        newTags.map(async (newTag) => {
            batch.set(
                doc(tags, newTag),
                { [projectUid]: loggedInUserUid },
                { merge: true }
            );
        })
    );
    await Promise.all(
        deletedTags.map(async (delTag) => {
            const tagDoc = await getDoc(doc(tags, delTag));
            const tagData = tagDoc.data();
            if (
                tagData &&
                keys(tagData).length === 1 &&
                keys(tagData)[0] === projectUid
            ) {
                batch.delete(doc(tags, delTag));
            } else if (tagData && keys(tagData).length > 0) {
                batch.update(doc(tags, delTag), {
                    [projectUid]: fieldDelete()
                });
            }
        })
    );
    await batch.commit();
};

export const addUserProject =
    (
        name: string,
        description: string,
        currentTags: string[],
        projectUid: string,
        iconName: string,
        iconForegroundColor: string,
        iconBackgroundColor: string
    ) =>
    async (dispatch: AppThunkDispatch, getState: () => RootState) => {
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
                const batch = writeBatch(database);
                const newProjectReference = doc(projects);
                batch.set(newProjectReference, newProject);
                const filesReference = collection(newProjectReference, "files");
                const csdFileReference = doc(filesReference);
                batch.set(csdFileReference, {
                    ...defaultCsd,
                    userUid: loggedInUserUid
                });
                batch.set(doc(filesReference), {
                    ...defaultOrc,
                    userUid: loggedInUserUid
                });
                batch.set(doc(filesReference), {
                    ...defaultSco,
                    userUid: loggedInUserUid
                });
                batch.set(
                    doc(targets, newProjectReference.id),
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
                dispatch(
                    openSnackbar("Could not add Project", SnackbarType.Error)
                );
            }
        }
    };

export const editUserProject =
    (
        name: string,
        description: string,
        currentTags: string[],
        projectUid: string,
        iconName: string,
        iconForegroundColor: string,
        iconBackgroundColor: string
    ) =>
    async (dispatch: any, getState: () => RootState) => {
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
                const newProjectReference = await doc(projects, projectUid);
                await updateDoc(newProjectReference, newProject);
                await handleProjectTags(
                    projectUid,
                    loggedInUserUid,
                    currentTags
                );
                dispatch(addUserProjectAction());
                dispatch(
                    openSnackbar("Project modified", SnackbarType.Success)
                );
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

export const deleteUserProject =
    (projectUid: string) =>
    async (dispatch: AppThunkDispatch, getState: () => RootState) => {
        const currentState = getState();
        const loggedInUserUid = selectLoggedInUid(currentState);
        if (loggedInUserUid) {
            const files = await getDocs(
                collection(doc(projects, projectUid), "files")
            );
            const batch = writeBatch(database);
            const documentReference = doc(projects, projectUid);
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

export const setTagsInput = (tags: Array<any>): ProfileActionTypes => {
    return {
        type: SET_TAGS_INPUT,
        payload: tags
    };
};

// export const getAllTagsFromUser =
//     (loggedInUserUid: string, allUserProjectsUids: string[]) =>
//     async (dispatch, getStore) => {
//         const store: RootState = getStore();

//         const currentAllTags =
//             store.ProfileReducer.profiles[loggedInUserUid].allTags;

//         if (allUserProjectsUids) {
//             const allTags = allUserProjectsUids.reduce((accumulator, item) =>
//                 (item.tags || []).concat(accumulator)
//             );

//             if (!equals(currentAllTags, allTags)) {
//                 dispatch({ type: GET_ALL_TAGS, allTags, loggedInUserUid });
//             }
//         }
//     };

export const addProject = () => {
    return openSimpleModal("new-project-prompt", {
        name: "New Project",
        description: "",
        label: "Create Project",
        newProject: true,
        projectID: "",
        iconName: undefined,
        iconForegroundColor: undefined,
        iconBackgroundColor: undefined
    });
};

export const followUser =
    (loggedInUserUid: string, profileUid: string) => async () => {
        const batch = writeBatch(database);
        const followersReference = doc(followers, profileUid);
        const followersData = await getDoc(followersReference);

        if (followersData.exists()) {
            batch.update(followersReference, {
                [loggedInUserUid]: getFirebaseTimestamp()
            });
        } else {
            batch.set(followersReference, {
                [loggedInUserUid]: getFirebaseTimestamp()
            });
        }

        const followingReference = doc(following, loggedInUserUid);
        const followingData = await getDoc(followingReference);
        if (followingData.exists()) {
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

export const unfollowUser =
    (loggedInUserUid: string, profileUid: string) => async () => {
        const batch = writeBatch(database);
        batch.update(doc(followers, profileUid), {
            [loggedInUserUid]: fieldDelete()
        });
        batch.update(doc(following, loggedInUserUid), {
            [profileUid]: fieldDelete()
        });
        await batch.commit();
    };

export const updateUserProfile =
    (
        originalUsername: string,
        username: string,
        displayName: string,
        bio: string,
        link1: string,
        link2: string,
        link3: string,
        backgroundIndex: number
    ) =>
    async (dispatch: AppThunkDispatch, getState: () => RootState) => {
        const currentState = getState();
        const loggedInUserUid = selectLoggedInUid(currentState);
        if (loggedInUserUid) {
            await updateDoc(doc(profiles, loggedInUserUid), {
                username,
                displayName,
                bio,
                link1,
                link2,
                link3,
                backgroundIndex
            });

            await deleteDoc(doc(usernames, originalUsername));
            await setDoc(doc(usernames, username), {
                userUid: loggedInUserUid
            });
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
): ((
    dispatch: AppThunkDispatch,
    getState: () => RootState
) => Promise<void>) => {
    return async (dispatch, getState) => {
        const currentState = getState();
        const loggedInUserUid = selectLoggedInUid(currentState);
        if (loggedInUserUid) {
            const names = await getDocs(usernames);
            const existingNames: string[] = [];
            names.forEach((name) => {
                if (name.id !== username) {
                    existingNames.push(name.id);
                }
            });

            dispatch(
                openSimpleModal("profile-edit-dialog", {
                    existingNames: existingNames,
                    username: username,
                    displayName: displayName,
                    bio: bio,
                    link1: link1,
                    link2: link2,
                    link3: link3,
                    backgroundIndex: backgroundIndex
                })
            );
        }
    };
};

export const editProject = (project: IProject) => {
    return openSimpleModal("new-project-prompt", {
        name: project.name,
        description: project.description,
        label: "Apply changes",
        projectID: project.projectUid,
        iconName: project.iconName,
        iconForegroundColor: project.iconForegroundColor,
        iconBackgroundColor: project.iconBackgroundColor,
        newProject: false
    });
};

export const deleteProject = (project: IProject) => {
    return openSimpleModal("delete-project-prompt", {
        projectUid: project.projectUid,
        projectName: project.name
    });
};

export const uploadProfileImage =
    (loggedInUserUid: string, file: File) =>
    async (dispatch: AppThunkDispatch) => {
        try {
            const uploadStorage = await storageReference(
                `images/${loggedInUserUid}/profile.jpeg`
            );
            await uploadBytes(uploadStorage, file);

            const imageUrl = await getDownloadURL(uploadStorage);
            await updateDoc(doc(profiles, loggedInUserUid), {
                photoUrl: imageUrl
            });
            dispatch(
                openSnackbar("Profile Picture Uploaded", SnackbarType.Success)
            );
        } catch {
            dispatch(
                openSnackbar(
                    "Profile Picture Upload Failed",
                    SnackbarType.Error
                )
            );
        }
    };

export const playListItem =
    ({ projectUid }: { projectUid: string | false }) =>
    async (
        dispatch: AppThunkDispatch,
        getState: () => RootState
    ): Promise<void> => {
        const state = getState();

        const currentlyPlayingProject = selectCurrentlyPlayingProject(state);

        if (projectUid === false) {
            console.log("playListItem: projectUid is false");
            return;
        }

        if (projectUid !== currentlyPlayingProject) {
            dispatch({
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
            const cachedTimestamp: Timestamp | number | undefined =
                state.ProjectsReducer.projects[projectUid]
                    .cachedProjectLastModified;

            const currentTimestamp: Timestamp | number | undefined =
                state.ProjectLastModifiedReducer[projectUid].timestamp;

            if (
                cachedTimestamp &&
                currentTimestamp &&
                typeof cachedTimestamp === "object" &&
                typeof currentTimestamp === "object"
            ) {
                timestampMismatch =
                    (cachedTimestamp as Timestamp).toMillis() !==
                    (currentTimestamp as Timestamp).toMillis();
            }
        }

        if (!projectIsCached || timestampMismatch || !projectHasLastModule) {
            const result = await downloadProjectOnce(projectUid)(dispatch);
            if (!result.exists) {
                console.error("Project not found:", projectUid);
                return;
            }
            await downloadAllProjectDocumentsOnce(projectUid)(dispatch);
            await downloadTargetsOnce(projectUid)(dispatch);
            await getProjectLastModifiedOnce(projectUid)(dispatch);
            // recursion
            return await playListItem({ projectUid })(dispatch, getState);
        }

        const playAction =
            getPlayActionFromTarget(projectUid)(state) ||
            getPlayActionFromProject(projectUid, state);

        if (playAction) {
            (playAction as any)(dispatch);
            dispatch({
                type: SET_CURRENTLY_PLAYING_PROJECT,
                projectUid
            });
        } else {
            // handle unplayable project
        }
    };

export const storeProfileProjectsCount = (
    projectsCount: ProjectsCount,
    profileUid: string
) => {
    return {
        type: STORE_PROFILE_PROJECTS_COUNT,
        projectsCount,
        profileUid
    };
};

export const storeUserProfile = (profile: IProfile, profileUid: string) => {
    return {
        type: STORE_USER_PROFILE,
        profile,
        profileUid
    };
};

export const storeProfileStars = (
    stars: Record<string, Timestamp>,
    profileUid: string
) => {
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
): ((dispatch: any) => Promise<void>) => {
    return async () => {
        if (!projectUid || !loggedInUserUid) {
            return;
        }
        const batch = writeBatch(database);
        const currentProjectStarsReference = await getDoc(
            doc(stars, projectUid)
        );
        const currentProjectStars = currentProjectStarsReference.exists()
            ? currentProjectStarsReference.data()
            : {};
        const currentlyStarred = keys(currentProjectStars || []).includes(
            loggedInUserUid
        );

        if (currentlyStarred) {
            batch.update(doc(stars, projectUid), {
                [loggedInUserUid]: fieldDelete()
            });
            batch.update(doc(profileStars, loggedInUserUid), {
                [projectUid]: fieldDelete()
            });
        } else {
            batch.set(
                doc(stars, projectUid),
                { [loggedInUserUid]: getFirebaseTimestamp() },
                { merge: true }
            );
            batch.set(
                doc(profileStars, loggedInUserUid),
                { [projectUid]: getFirebaseTimestamp() },
                { merge: true }
            );
        }
        await batch.commit();
    };
};
