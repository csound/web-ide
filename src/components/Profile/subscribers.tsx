import { store } from "@store/index";
import { following, profiles, projects, tags } from "@config/firestore";
import { setProject, unsetProject } from "@comp/Projects/actions";
import { convertProjectSnapToProject } from "@comp/Projects/utils";
import { getUserProfileAction } from "./actions";
import { UPDATE_LOGGED_IN_FOLLOWING, UPDATE_PROFILE_FOLLOWING } from "./types";
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
            dispatch(
                getUserProfileAction({
                    profile: profile.data(),
                    profileUid
                })
            );
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
                        return { displayName: "Deleter user" };
                    }
                })
            );
            dispatch({
                type: UPDATE_PROFILE_FOLLOWING,
                userProfiles,
                userProfileUids
            });
        },
        (error: any) => console.error(error)
    );
    return unsubscribe;
};

export const subscribeToLoggedInUserFollowing = (
    loggedInUid: string,
    dispatch: any
) => {
    const unsubscribe: () => void = following.doc(loggedInUid).onSnapshot(
        async followingRef => {
            const userProfileUids = keys(followingRef.data() || {}) as string[];
            dispatch({
                type: UPDATE_LOGGED_IN_FOLLOWING,
                userProfileUids
            });
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
                    .where("projectUids", "array-contains", projSnap.id)
                    .get()
                    .then(d => d.docs.map(prop("id")));
                const proj = await convertProjectSnapToProject(projSnap);
                await dispatch(setProject(assoc("tags", projTags, proj)));
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
