import { AppThunkDispatch, RootState, store } from "@root/store";
import {
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    where
} from "firebase/firestore";
import {
    database,
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
    storeProfileStars,
    setFollowingLoading,
    setFollowersLoading,
    setStarsLoading
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
    dispatch: AppThunkDispatch
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

const subscribeToProfileConnections = (
    profileUid: string,
    dispatch: AppThunkDispatch,
    relation: "following" | "followers"
): (() => void) => {
    const setLoading =
        relation === "following" ? setFollowingLoading : setFollowersLoading;
    const updateType =
        relation === "following"
            ? UPDATE_PROFILE_FOLLOWING
            : UPDATE_PROFILE_FOLLOWERS;
    let revision = 0;
    dispatch(setLoading(profileUid, true));

    const unsubscribe = onSnapshot(
        doc(relation === "following" ? following : followers, profileUid),
        async (snapshot) => {
            const currentRevision = ++revision;
            dispatch(setLoading(profileUid, true));
            try {
                const sorted = sort(
                    descend(propOr(Number.NEGATIVE_INFINITY, "val")),
                    listifyObject(snapshot.data() ?? {})
                );
                // Recheck cached profiles too: an account may have been deleted
                // since the last visit. This only filters local display data.
                const snapshots = await Promise.all(
                    sorted.map(({ key }) => getDoc(doc(profiles, key)))
                );
                if (currentRevision !== revision) return;
                const userProfiles = snapshots
                    .filter((profile) => profile.exists())
                    .map((profile) => {
                        const data = profile.data()!;
                        return {
                            ...data,
                            userUid: profile.id,
                            username: data.username ?? "",
                            ...(data.userJoinDate
                                ? { userJoinDate: data.userJoinDate.toMillis() }
                                : {})
                        };
                    });
                dispatch({
                    type: updateType,
                    profileUid,
                    userProfiles,
                    userProfileUids: userProfiles.map(
                        (profile) => profile.userUid
                    )
                });
            } catch (error) {
                console.error(error);
            } finally {
                if (currentRevision === revision)
                    dispatch(setLoading(profileUid, false));
            }
        },
        (error) => {
            ++revision;
            console.error(error);
            dispatch(setLoading(profileUid, false));
        }
    );
    return () => {
        ++revision;
        unsubscribe();
    };
};

export const subscribeToFollowing = (
    profileUid: string,
    dispatch: AppThunkDispatch
): (() => void) =>
    subscribeToProfileConnections(profileUid, dispatch, "following");

export const subscribeToFollowers = (
    profileUid: string,
    dispatch: AppThunkDispatch
): (() => void) =>
    subscribeToProfileConnections(profileUid, dispatch, "followers");

export const subscribeToProjectsCount = (
    profileUid: string,
    dispatch: AppThunkDispatch
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
    dispatch: AppThunkDispatch
): (() => void) => {
    // Set loading state
    dispatch(setStarsLoading(profileUid, true));

    const unsubscribe: () => void = onSnapshot(
        doc(profileStars, profileUid),
        (starsReference) => {
            const starsData = starsReference.data();
            if (!starsData) {
                // Clear loading state when no data is found
                dispatch(setStarsLoading(profileUid, false));
                return;
            }

            // Convert Firestore Timestamps to serializable values
            const serializedStarsData: Record<string, any> = {};
            for (const projectUid in starsData) {
                const timestamp = starsData[projectUid];
                if (timestamp && typeof timestamp.toDate === "function") {
                    // Convert Firestore Timestamp to milliseconds
                    serializedStarsData[projectUid] = {
                        toDate: timestamp.toDate().getTime()
                    };
                } else {
                    // Handle case where it's already serialized or different format
                    serializedStarsData[projectUid] = timestamp;
                }
            }

            const state = store.getState();
            const starredProjects = Object.keys(starsData);
            const cachedProjects = Object.keys(state.ProjectsReducer.projects);
            const missingProjects = difference(starredProjects, cachedProjects);
            missingProjects.forEach(async (projectUid) => {
                try {
                    await dispatch(downloadProjectOnce(projectUid));
                } catch (error) {
                    console.error(
                        "Error downloading project:",
                        projectUid,
                        error
                    );
                }
            });
            dispatch(storeProfileStars(serializedStarsData, profileUid));
            // Clear loading state
            dispatch(setStarsLoading(profileUid, false));
        },
        (error: any) => {
            console.error(error);
            // Clear loading state on error
            dispatch(setStarsLoading(profileUid, false));
        }
    );
    return unsubscribe;
};

export const subscribeToProfileProjects = (
    profileUid: string,
    isProfileOwner: boolean,
    dispatch: AppThunkDispatch
): (() => void) => {
    const unsubscribe = onSnapshot(
        isProfileOwner
            ? query(projects, where("userUid", "==", profileUid))
            : query(
                  projects,
                  where("userUid", "==", profileUid),
                  where("public", "==", true)
              ),
        async (projectSnaps) => {
            const currentProfileProjects = pipe(
                pathOr([], ["ProjectsReducer", "projects"]),
                filter(propEq("userUid", profileUid))
            )(store.getState());
            const projectsDeleted = difference(
                keys(currentProfileProjects).sort(),
                (projectSnaps.docs as any[]).map((snapDoc) => snapDoc.id).sort()
            );
            if (!projectSnaps.empty) {
                Promise.all(
                    projectSnaps.docs.map(async (projSnap) => {
                        const projTags = await getDocs(
                            query(tags, where(projSnap.id, "==", profileUid))
                        ).then((d) => d.docs.map(prop("id")));
                        const proj =
                            await convertProjectSnapToProject(projSnap);
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
