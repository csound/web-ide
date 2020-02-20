import { store } from "@store/index";
import {
    following,
    followers,
    profiles,
    projects,
    projectsCount,
    profileStars,
    tags
} from "@config/firestore";
import {
    downloadProjectOnce,
    storeProjectLocally,
    unsetProject
} from "@comp/Projects/actions";
import { convertProjectSnapToProject } from "@comp/Projects/utils";
import {
    storeUserProfile,
    storeProfileProjectsCount,
    storeProfileStars
} from "./actions";
import { UPDATE_PROFILE_FOLLOWING, UPDATE_PROFILE_FOLLOWERS } from "./types";
import { listifyObject } from "@root/utils";
import {
    assoc,
    descend,
    difference,
    filter,
    isEmpty,
    keys,
    map,
    pathOr,
    pipe,
    prop,
    propEq,
    propOr,
    sort
} from "ramda";

export const subscribeToProfile = (profileUid: string, dispatch: any) => {
    const unsubscribe: () => void = profiles.doc(profileUid).onSnapshot(
        profile => {
            dispatch(storeUserProfile(profile.data(), profileUid));
        },
        (error: any) => console.error(error)
    );
    return unsubscribe;
};

export const subscribeToFollowing = (profileUid: string, dispatch: any) => {
    const unsubscribe: () => void = following.doc(profileUid).onSnapshot(
        async followingRef => {
            const state = store.getState();
            const userProfileData = followingRef.data();
            const userProfileDataSorted = sort(
                descend(propOr(-Infinity, "val")),
                listifyObject(userProfileData)
            );
            const userProfileUids = map(prop("key"), userProfileDataSorted);
            const cachedProfileUids = keys(state.ProfileReducer.profiles);
            const missingProfileUids = difference(
                userProfileUids,
                cachedProfileUids
            );

            const missingProfiles = await Promise.all(
                missingProfileUids.map(async followingProfileUid => {
                    const profPromise = await profiles
                        .doc(followingProfileUid)
                        .get();
                    if (profPromise.exists) {
                        return profPromise.data();
                    } else {
                        return { displayName: "Deleted user" };
                    }
                })
            );
            dispatch({
                type: UPDATE_PROFILE_FOLLOWING,
                profileUid,
                userProfiles: missingProfiles,
                userProfileUids
            });
        },
        (error: any) => console.error(error)
    );
    return unsubscribe;
};

export const subscribeToFollowers = (profileUid: string, dispatch: any) => {
    const unsubscribe: () => void = followers.doc(profileUid).onSnapshot(
        async followersRef => {
            const state = store.getState();
            const userProfileData = followersRef.data();
            const userProfileDataSorted = sort(
                descend(propOr(-Infinity, "val")),
                listifyObject(userProfileData)
            );
            const userProfileUids = map(prop("key"), userProfileDataSorted);
            const cachedProfileUids = keys(state.ProfileReducer.profiles);
            const missingProfileUids = difference(
                userProfileUids,
                cachedProfileUids
            );

            const missingProfiles = await Promise.all(
                missingProfileUids.map(async followerProfileUid => {
                    const profPromise = await profiles
                        .doc(followerProfileUid)
                        .get();
                    if (profPromise.exists) {
                        return profPromise.data();
                    } else {
                        return { displayName: "Deleted user" };
                    }
                })
            );
            dispatch({
                type: UPDATE_PROFILE_FOLLOWERS,
                profileUid,
                userProfiles: missingProfiles,
                userProfileUids
            });
        },
        (error: any) => console.error(error)
    );
    return unsubscribe;
};

export const subscribeToProjectsCount = (profileUid: string, dispatch: any) => {
    const unsubscribe: () => void = projectsCount.doc(profileUid).onSnapshot(
        projectsCount => {
            dispatch(
                storeProfileProjectsCount(projectsCount.data(), profileUid)
            );
        },
        (error: any) => console.error(error)
    );
    return unsubscribe;
};

export const subscribeToProfileStars = (profileUid: string, dispatch: any) => {
    const unsubscribe: () => void = profileStars.doc(profileUid).onSnapshot(
        starsRef => {
            const starsData = starsRef.data();
            const state = store.getState();
            const starredProjects = keys(starsData);
            const cachedProjects = keys(state.ProjectsReducer.projects);
            const missingProjects = difference(starredProjects, cachedProjects);
            missingProjects.forEach(projectUid =>
                dispatch(downloadProjectOnce(projectUid))
            );
            dispatch(storeProfileStars(starsData, profileUid));
        },
        (error: any) => console.error(error)
    );
    return unsubscribe;
};

export const subscribeToProfileProjects = (
    profileUid: string,
    isProfileOwner: boolean,
    dispatch: any
) => {
    const unsubscribe = (isProfileOwner
        ? projects.where("userUid", "==", profileUid)
        : projects
              .where("userUid", "==", profileUid)
              .where("public", "==", true)
    ).onSnapshot(async projectSnaps => {
        const currentProfileProjects = pipe(
            pathOr([], ["ProjectsReducer", "projects"]),
            filter(propEq("userUid", profileUid))
        )(store.getState());
        const projectsDeleted = difference(
            keys(currentProfileProjects).sort(),
            map(prop("id"), projectSnaps.docs).sort()
        );
        if (!projectSnaps.empty) {
            await projectSnaps.docs.forEach(async projSnap => {
                const projTags = await tags
                    .where(projSnap.id, "==", profileUid)
                    .get()
                    .then(d => d.docs.map(prop("id")));
                const proj = await convertProjectSnapToProject(projSnap);
                await dispatch(
                    storeProjectLocally(assoc("tags", projTags, proj))
                );
            });
        }

        if (!isEmpty(projectsDeleted)) {
            projectsDeleted.forEach(async projectUid => {
                await dispatch(unsetProject(projectUid));
            });
        }
    });
    return unsubscribe;
};
