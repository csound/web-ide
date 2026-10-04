import { AppThunkDispatch, store } from "@root/store";
import { doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import {
    following,
    followers,
    profiles,
    projects,
    projectsCount,
    profileStars,
    tags
} from "@config/firestore";
import { storeProjectLocally, unsetProject } from "@comp/projects/actions";
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
import { descend, propOr, sort } from "ramda";
import { STORE_PROJECT_TAGS } from "../projects/types";

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
                dispatch(storeProfileStars({}, profileUid));
                // Clear loading state when no data is found
                dispatch(setStarsLoading(profileUid, false));
                return;
            }

            // Convert Firestore Timestamps to serializable values
            const serializedStarsData: Record<string, any> = {};
            for (const projectUid in starsData) {
                const timestamp = starsData[projectUid];
                serializedStarsData[projectUid] = {
                    toDate:
                        typeof timestamp?.toMillis === "function"
                            ? timestamp.toMillis()
                            : typeof timestamp === "number"
                              ? timestamp
                              : 0
                };
            }

            dispatch(storeProfileStars(serializedStarsData, profileUid));
            // Clear loading state
            dispatch(setStarsLoading(profileUid, false));
        },
        (error: any) => {
            console.error(error);
            dispatch(storeProfileStars({}, profileUid));
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
    let active = true;
    let generation = 0;
    const tagSubscriptions = new Map<string, { stop: () => void }>();
    const unsubscribe = onSnapshot(
        isProfileOwner
            ? query(projects, where("userUid", "==", profileUid))
            : query(
                  projects,
                  where("userUid", "==", profileUid),
                  where("public", "==", true)
              ),
        async (projectSnaps) => {
            if (!active) return;
            const request = ++generation;
            const ids = new Set(projectSnaps.docs.map((snap) => snap.id));
            // Remove listeners and cached rows as soon as a project leaves this view.
            for (const [id, subscription] of tagSubscriptions)
                if (!ids.has(id)) {
                    subscription.stop();
                    tagSubscriptions.delete(id);
                }
            for (const project of Object.values(
                store.getState().ProjectsReducer.projects
            )) {
                if (
                    project.userUid === profileUid &&
                    !ids.has(project.projectUid)
                )
                    dispatch(unsetProject(project.projectUid));
            }
            try {
                const localProjects = await Promise.all(
                    projectSnaps.docs.map(convertProjectSnapToProject)
                );
                if (!active || request !== generation) return;
                if (localProjects.length)
                    dispatch(storeProjectLocally(localProjects));
                for (const projectUid of ids) {
                    if (tagSubscriptions.has(projectUid)) continue;
                    // Keep tags current without re-reading them on every metadata update.
                    const subscription = { stop: () => {} };
                    tagSubscriptions.set(projectUid, subscription);
                    subscription.stop = onSnapshot(
                        query(tags, where(projectUid, "==", profileUid)),
                        (snapshot) => {
                            if (
                                !active ||
                                tagSubscriptions.get(projectUid) !==
                                    subscription
                            )
                                return;
                            dispatch({
                                type: STORE_PROJECT_TAGS,
                                projectUid,
                                tags: snapshot.docs.map((tag) => tag.id)
                            });
                        },
                        (error) =>
                            console.error("Could not load project tags", error)
                    );
                }
            } catch (error) {
                if (active && request === generation)
                    console.error("Could not load profile projects", error);
            }
        },
        (error) => console.error("Could not load profile projects", error)
    );
    return () => {
        active = false;
        generation++;
        unsubscribe();
        for (const subscription of tagSubscriptions.values())
            subscription.stop();
        tagSubscriptions.clear();
    };
};
