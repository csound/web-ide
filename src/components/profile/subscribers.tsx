import { store } from "@root/store";
import {
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    where
} from "firebase/firestore";
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
} from "@comp/projects/actions";
import { convertProjectSnapToProject } from "@comp/projects/utils";
import {
    storeUserProfile,
    storeProfileProjectsCount,
    storeProfileStars
} from "./actions";
import {
    IProfile,
    UPDATE_PROFILE_FOLLOWING,
    UPDATE_PROFILE_FOLLOWERS
} from "./types";
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
import { IProject } from "../projects/types";

export const subscribeToProfile = (
    profileUid: string,
    dispatch: (any) => void
): (() => void) => {
    const unsubscribe: () => void = onSnapshot(
        doc(profiles, profileUid),
        (profile) => {
            const profileData = profile.data() as any;
            if (profileData.userJoinDate) {
                profileData.userJoinDate = profileData.userJoinDate.toMillis();
            }
            dispatch(storeUserProfile(profileData as IProfile, profileUid));
        },
        (error: any) => console.error(error)
    );
    return unsubscribe;
};

export const subscribeToFollowing = (
    profileUid: string,
    dispatch: (any) => void
): (() => void) => {
    const unsubscribe: () => void = onSnapshot(
        doc(following, profileUid),
        async (followingReference) => {
            const state = store.getState();
            const userProfileData = followingReference.data();
            const userProfileDataSorted = sort(
                descend(propOr(Number.NEGATIVE_INFINITY, "val")),
                listifyObject(userProfileData || {})
            );
            const userProfileUids = map(prop("key"), userProfileDataSorted);
            const cachedProfileUids = keys(state.ProfileReducer.profiles);
            const missingProfileUids = difference(
                userProfileUids,
                cachedProfileUids
            );

            const missingProfiles = await Promise.all(
                missingProfileUids.map(async (followingProfileUid) => {
                    const profPromise = await getDoc(
                        doc(profiles, followingProfileUid)
                    );
                    const profileData = profPromise.exists()
                        ? profPromise.data()
                        : { displayName: "Deleted user" };
                    if (profileData.userJoinDate) {
                        profileData.userJoinDate =
                            profileData.userJoinDate.toMillis();
                    }
                    return profileData;
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

export const subscribeToFollowers = (
    profileUid: string,
    dispatch: (any) => void
): (() => void) => {
    const unsubscribe: () => void = onSnapshot(
        doc(followers, profileUid),
        async (followersReference) => {
            const state = store.getState();
            const userProfileData = followersReference.data();
            const userProfileDataSorted = sort(
                descend(propOr(Number.NEGATIVE_INFINITY, "val")),
                listifyObject(userProfileData || {})
            );
            const userProfileUids = map(prop("key"), userProfileDataSorted);
            const cachedProfileUids = keys(state.ProfileReducer.profiles);
            const missingProfileUids = difference(
                userProfileUids,
                cachedProfileUids
            );

            const missingProfiles = await Promise.all(
                missingProfileUids.map(async (followerProfileUid) => {
                    const profPromise = await getDoc(
                        doc(profiles, followerProfileUid)
                    );

                    const profileData = profPromise.exists()
                        ? profPromise.data()
                        : { displayName: "Deleted user" };

                    if (profileData.userJoinDate) {
                        profileData.userJoinDate =
                            profileData.userJoinDate.toMillis();
                    }
                    return profileData;
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

export const subscribeToProjectsCount = (
    profileUid: string,
    dispatch: (any) => void
): (() => void) => {
    const unsubscribe: () => void = onSnapshot(
        doc(projectsCount, profileUid),
        (projectsCount) => {
            const projectsCountData = projectsCount.data();
            if (projectsCountData) {
                const projectsCount_ = {
                    public: projectsCountData.public || 0,
                    all: projectsCountData.all || 0
                };
                projectsCountData &&
                    dispatch(
                        storeProfileProjectsCount(projectsCount_, profileUid)
                    );
            }
        },
        (error: any) => console.error(error)
    );
    return unsubscribe;
};

export const subscribeToProfileStars = (
    profileUid: string,
    dispatch: (any) => void
): (() => void) => {
    const unsubscribe: () => void = onSnapshot(
        doc(profileStars),
        (starsReference) => {
            const starsData = starsReference.data();
            if (!starsData) {
                return;
            }
            const state = store.getState();
            const starredProjects = keys(starsData);
            const cachedProjects = keys(state.ProjectsReducer.projects);
            const missingProjects = difference(starredProjects, cachedProjects);
            missingProjects.forEach((projectUid) =>
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
    dispatch: (any) => void
): (() => void) => {
    const unsubscribe = onSnapshot(
        isProfileOwner
            ? query(projects, where("userUid", "==", profileUid))
            : query(
                  projects,
                  where("public", "==", true)
                  // query(
                  //     query(projects, where("userUid", "==", profileUid)),
                  // )
              ),
        async (projectSnaps) => {
            const currentProfileProjects = pipe(
                pathOr([], ["ProjectsReducer", "projects"]),
                filter(propEq("userUid", profileUid))
            )(store.getState());
            const projectsDeleted = difference(
                keys(currentProfileProjects).sort(),
                map(prop("id"), projectSnaps.docs).sort()
            );
            if (!projectSnaps.empty) {
                Promise.all(
                    projectSnaps.docs.map(async (projSnap) => {
                        const projTags = await getDocs(
                            query(tags, where(projSnap.id, "==", profileUid))
                        ).then((d) => d.docs.map(prop("id")));
                        const proj = await convertProjectSnapToProject(
                            projSnap
                        );
                        return assoc("tags", projTags, proj) as IProject;
                    })
                ).then((localProjects) => {
                    dispatch(storeProjectLocally(localProjects));
                });
            }

            if (!isEmpty(projectsDeleted)) {
                projectsDeleted.forEach(async (projectUid) => {
                    await dispatch(unsetProject(projectUid));
                });
            }
        }
    );
    return unsubscribe;
};
