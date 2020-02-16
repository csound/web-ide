import { store } from "@store/index";
import {
    following,
    followers,
    profiles,
    projects,
    projectsCount,
    tags
} from "@config/firestore";
import { storeProjectLocally, unsetProject } from "@comp/Projects/actions";
import { convertProjectSnapToProject } from "@comp/Projects/utils";
import { storeUserProfile, storeProfileProjectsCount } from "./actions";
import { UPDATE_PROFILE_FOLLOWING, UPDATE_PROFILE_FOLLOWERS } from "./types";
import {
    assoc,
    difference,
    filter,
    isEmpty,
    keys,
    map,
    pathOr,
    pipe,
    prop,
    propEq
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
            const userProfileUids = keys(followingRef.data() || {}) as string[];
            const userProfiles = await Promise.all(
                userProfileUids.map(async followingProfileUid => {
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
                userProfiles,
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
            const userProfileUids = keys(followersRef.data() || {}) as string[];
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
                missingProfiles,
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
