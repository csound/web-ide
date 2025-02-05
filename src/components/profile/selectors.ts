import { RootState } from "@root/store";
import { createSelector } from "reselect";
import { IProfileReducer } from "./reducer";
import { path, pathOr } from "ramda";
// import Fuse from "fuse.js";
import { IProject } from "../projects/types";

export const selectUserFollowing =
    (profileUid: string | undefined): ((store: RootState) => Array<any>) =>
    (store: RootState) => {
        if (profileUid) {
            const state: IProfileReducer = store.ProfileReducer;
            return pathOr([], ["profiles", profileUid, "following"], state);
        } else {
            return [];
        }
    };

export const selectUserProjects =
    (profileUid: string | undefined) => (store: RootState) => {
        if (profileUid) {
            const state = store.ProjectsReducer.projects;

            // Filter projects by matching `userUid` with `profileUid`
            const filteredProjects = Object.values(state).filter(
                (project) => project.userUid === profileUid
            );

            return filteredProjects;
        } else {
            return [];
        }
    };

export const selectProjectFilterString = (
    store: RootState
): string | undefined => {
    const state: IProfileReducer = store.ProfileReducer;
    return state.projectFilterString;
};

export const selectFollowingFilterString = (
    store: RootState
): string | undefined => {
    const state: IProfileReducer = store.ProfileReducer;
    return state.followingFilterString;
};

export const selectUserProfile =
    (profileUid: string | undefined) => (store: RootState) => {
        if (profileUid) {
            const state: IProfileReducer = store.ProfileReducer;
            return state.profiles[profileUid];
        }
    };

const selectLogInReducer = (state: RootState) => state.LoginReducer;
const selectProfiles = (state: RootState) => state.ProfileReducer.profiles;

// Selector to get the username for a specific profileUid
export const selectLoggedInUserName = createSelector(
    [selectLogInReducer, selectProfiles],
    (loggedInUser, profiles) => {
        if (!loggedInUser || !loggedInUser.loggedInUid) {
            return undefined;
        }

        const matchingProfile = profiles[loggedInUser.loggedInUid];
        if (matchingProfile) {
            return matchingProfile.username;
        }
    }
);

export const selectLoggedInUserStars = (store: RootState): Array<any> => {
    const loggedInUid: string | undefined = store.LoginReducer.loggedInUid;
    if (loggedInUid) {
        const state: IProfileReducer = store.ProfileReducer;
        return pathOr([], ["profiles", loggedInUid, "starred"], state);
    } else {
        return [];
    }
};

// export const selectFilteredUserProjects = createSelector(
//     [selectUserProjects, selectProjectFilterString],
//     (userProjects, projectFilterString) => {
//         let result: any = [];
//         if (projectFilterString === undefined || projectFilterString === "") {
//             result = userProjects;
//         } else {
//             const options = {
//                 shouldSort: true,
//                 keys: ["description", "name", "tags"]
//             };

//             const fuse = new Fuse(userProjects, options);
//             result = fuse.search(projectFilterString).map((x) => x.item);
//         }

//         return result;
//     }
// );

// export const selectFilteredUserFollowing =
//     (profileUid: string): ((store: RootState) => any) =>
//     (store) =>
//         createSelector(
//             [selectUserFollowing(profileUid), selectFollowingFilterString],
//             (userFollowing, followingFilterString) => {
//                 const followingProfiles = userFollowing.map(
//                     (profileUid) => selectUserProfile(profileUid)(store) || {}
//                 );

//                 if (
//                     followingFilterString === undefined ||
//                     followingFilterString === ""
//                 ) {
//                     return followingProfiles;
//                 }

//                 const options = {
//                     shouldSort: true,
//                     threshold: 0.4,
//                     location: 0,
//                     distance: 100,
//                     maxPatternLength: 32,
//                     minMatchCharLength: 1,
//                     keys: ["username", "bio", "displayName"]
//                 };
//                 const fuse = new Fuse(followingProfiles, options);
//                 const result = fuse.search(followingFilterString);
//                 return result;
//             }
//         )(store);

export const selectFilteredUserFollowers =
    (profileUid: string): ((store: RootState) => any) =>
    (store) => {
        const state: IProfileReducer = store.ProfileReducer;
        const followerUids = pathOr(
            [],
            ["profiles", profileUid, "followers"],
            state
        );
        return (followerUids || []).map((followerUid) =>
            path(["profiles", followerUid], state)
        );
    };

export const selectUserImageURL =
    (profileUid: string | undefined) => (store: RootState) => {
        if (profileUid) {
            const state: IProfileReducer = store.ProfileReducer;
            return state.profiles[profileUid]?.photoUrl ?? undefined;
        } else {
            return;
        }
    };

export const selectCurrentlyPlayingProject = (
    store: RootState
): string | undefined => {
    const state: IProfileReducer = store.ProfileReducer;
    return state.currentlyPlayingProject;
};

export const selectCurrentTagText = (store: RootState): string => {
    const state: IProfileReducer = store.ProfileReducer;
    return state.currentTagText;
};

export const selectTags =
    (projectUid: string): ((store: RootState) => any) =>
    (store) => {
        return pathOr(
            [],
            ["ProjectsReducer", "projects", projectUid, "tags"],
            store
        );
    };

export const selectProfileStars =
    (profileUid: string) => (store: RootState) => {
        return pathOr(
            [],
            ["ProfileReducer", "profiles", profileUid, "stars"],
            store
        );
    };

export const selectAllUserProjectUids =
    (profileUid: string | undefined) => (store: RootState) => {
        if (profileUid) {
            const allUserProjects: IProject[] = (
                Object.values(
                    store?.ProjectsReducer?.projects ||
                        ({} as Record<string, IProject>)
                ) as IProject[]
            ).filter((p: IProject) => p.userUid === profileUid);

            return allUserProjects.map((p) => p.projectUid);
        } else {
            return [];
        }
    };

export const selectAllTagsFromUser =
    (profileUid: string): ((store: RootState) => any) =>
    (store) => {
        return pathOr(
            [],
            ["ProfileReducer", "profiles", profileUid, "allTags"],
            store
        );
    };

// Selector to get profileUid (customize this as per your state structure)
export const selectProfileUid = createSelector(
    [(state: RootState) => state.LoginReducer.loggedInUid], // Replace with the correct state slice
    (loggedInUid) => loggedInUid
);

// Selector to get the projectsCount for a specific profileUid
export const selectProfileProjectsCount = createSelector(
    [selectProfiles, selectProfileUid],
    (profiles, profileUid) => {
        if (!profileUid || !profiles[profileUid]) {
            return {
                all: 0,
                public: 0
            };
        }
        return (
            profiles[profileUid].projectsCount ?? {
                all: 0,
                public: 0
            }
        );
    }
);

// export const selectProjectIconStyle = (
//     projectUid: string
// ): ((store: IStore) => any) => (store) => {
//     const proj = pathOr({}, ["ProjectsReducer", "projects", projectUid], store);
//     return {
//         iconBackgroundColor: prop("iconBackgroundColor", proj),
//         iconForegroundColor: prop("iconForegroundColor", proj),
//         iconName: prop("iconName", proj)
//     };
// };
