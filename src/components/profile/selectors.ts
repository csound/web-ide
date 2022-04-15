import { IStore } from "@store/types";
import { createSelector } from "reselect";
import { IProfileReducer } from "./reducer";
// import { IProfile } from "./types";
import { IFirestoreProfile } from "@db/types";
import { path, pathOr, pickBy, propEq, values } from "ramda";
import Fuse from "fuse.js";

export const selectUserFollowing = (
    profileUid: string | undefined
): ((store: IStore) => Array<any>) => (store: IStore) => {
    if (!profileUid) {
        return [];
    } else {
        const state: IProfileReducer = store.ProfileReducer;
        return pathOr([], ["profiles", profileUid, "following"], state);
    }
};

export const selectUserProjects = (
    profileUid: string | undefined
): ((store: IStore) => Array<any>) => (store: IStore) => {
    if (!profileUid) {
        return [];
    } else {
        const state = store.ProjectsReducer.projects;
        return values((pickBy as any)(propEq("userUid", profileUid), state));
    }
};

export const selectProjectFilterString = (
    store: IStore
): string | undefined => {
    const state: IProfileReducer = store.ProfileReducer;
    return state.projectFilterString;
};

export const selectFollowingFilterString = (
    store: IStore
): string | undefined => {
    const state: IProfileReducer = store.ProfileReducer;
    return state.followingFilterString;
};

export const selectUserProfile = (
    profileUid: string | undefined
): ((store: any) => IFirestoreProfile) => (store: any) => {
    if (!profileUid) {
        return;
    } else {
        const state: IProfileReducer = store.ProfileReducer;
        return path(["profiles", profileUid], state);
    }
};

export const selectUserName = (
    profileUid: string | undefined
): ((store: IStore) => string | undefined) => (store) => {
    if (!profileUid) {
        return;
    } else {
        const state: IProfileReducer = store.ProfileReducer;
        return path(["profiles", profileUid, "username"], state);
    }
};

export const selectLoggedInUserStars = (store: IStore): Array<any> => {
    const loggedInUid: string | undefined = store.LoginReducer.loggedInUid;
    if (loggedInUid) {
        const state: IProfileReducer = store.ProfileReducer;
        return pathOr([], ["profiles", loggedInUid, "starred"], state);
    } else {
        return [];
    }
};

export const selectFilteredUserProjects = (
    profileUid: string | undefined
): ((any) => any) =>
    createSelector(
        [
            selectUserProjects(profileUid),
            selectProjectFilterString,
            selectLoggedInUserStars
        ],
        (userProjects, projectFilterString, stars) => {
            let result: any = [];
            if (
                typeof projectFilterString === "undefined" ||
                projectFilterString === ""
            ) {
                result = userProjects;
            } else {
                const options = {
                    shouldSort: true,
                    keys: ["description", "name", "tags"]
                };

                const fuse = new Fuse(userProjects, options);
                result = fuse.search(projectFilterString).map((x) => x.item);
            }

            return result;
        }
    );

export const selectFilteredUserFollowing = (
    profileUid: string
): ((store: IStore) => any) => (store) =>
    createSelector(
        [selectUserFollowing(profileUid), selectFollowingFilterString],
        (userFollowing, followingFilterString) => {
            const followingProfiles = userFollowing.map(
                (profileUid) => selectUserProfile(profileUid)(store) || {}
            );

            if (
                typeof followingFilterString === "undefined" ||
                followingFilterString === ""
            ) {
                return followingProfiles;
            }

            const options = {
                shouldSort: true,
                threshold: 0.4,
                location: 0,
                distance: 100,
                maxPatternLength: 32,
                minMatchCharLength: 1,
                keys: ["username", "bio", "displayName"]
            };
            const fuse = new Fuse(followingProfiles, options);
            const result = fuse.search(followingFilterString);
            return result;
        }
    )(store);

export const selectFilteredUserFollowers = (
    profileUid: string
): ((store: IStore) => any) => (store) => {
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

export const selectUserImageURL = (
    profileUid: string | undefined
): ((store: IStore) => any) => (store) => {
    if (!profileUid) {
        return;
    } else {
        const state: IProfileReducer = store.ProfileReducer;
        return pathOr("", ["profiles", profileUid, "photoUrl"], state);
    }
};

export const selectCurrentlyPlayingProject = (
    store: IStore
): string | undefined => {
    const state: IProfileReducer = store.ProfileReducer;
    return state.currentlyPlayingProject;
};

export const selectCurrentTagText = (store: IStore): string => {
    const state: IProfileReducer = store.ProfileReducer;
    return state.currentTagText;
};

export const selectTags = (projectUid: string): ((store: IStore) => any) => (
    store
) => {
    return pathOr(
        [],
        ["ProjectsReducer", "projects", projectUid, "tags"],
        store
    );
};

export const selectProfileStars = (
    profileUid: string
): ((store: IStore) => any) => (store) => {
    return pathOr(
        [],
        ["ProfileReducer", "profiles", profileUid, "stars"],
        store
    );
};

export const selectAllUserProjectUids = (
    profileUid: string | undefined
): ((store: IStore) => any) => (store) => {
    if (!profileUid) {
        return [];
    } else {
        const allUserProjects = values(
            pathOr({}, ["ProjectsReducer", "projects"], store)
        ).filter((p) => p.userUid === profileUid);
        return allUserProjects.map((p) => p.projectUid);
    }
};

export const selectAllTagsFromUser = (
    profileUid: string
): ((store: IStore) => any) => (store) => {
    return pathOr(
        [],
        ["ProfileReducer", "profiles", profileUid, "allTags"],
        store
    );
};

export const selectProfileProjectsCount = (
    profileUid: string
): ((store: IStore) => any) => (store) => {
    return pathOr(
        { all: 0, default: 0 },
        ["ProfileReducer", "profiles", profileUid, "projectsCount"],
        store
    );
};

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
