import { createSelector } from "reselect";
import { ProfileReducer } from "./reducer";
import { pathOr, pickBy, propEq, values } from "ramda";
import Fuse from "fuse.js";

export const selectUserFollowing = (profileUid: string | null) => (
    store: any
) => {
    if (!profileUid) {
        return [];
    } else {
        const state: ProfileReducer = store.ProfileReducer;
        return pathOr([], ["profiles", profileUid, "following"], state);
    }
};

export const selectUserProjects = (profileUid: string | null) => (
    store: any
) => {
    if (!profileUid) {
        return [];
    } else {
        const state: ProfileReducer = store.ProjectsReducer.projects;
        return values((pickBy as any)(propEq("userUid", profileUid), state));
    }
};

// export const selectStarProjectRequesting = (store: any) => {
//     const state: ProfileReducer = store.ProfileReducer;
//     return state.starProjectRequesting;
// };

export const selectProjectFilterString = (store: any) => {
    const state: ProfileReducer = store.ProfileReducer;
    return state.projectFilterString;
};

export const selectFollowingFilterString = (store: any) => {
    const state: ProfileReducer = store.ProfileReducer;
    return state.followingFilterString;
};

export const selectUserProfile = (profileUid: string | null) => (
    store: any
) => {
    if (!profileUid) {
        return null;
    } else {
        const state: ProfileReducer = store.ProfileReducer;
        return pathOr(null, ["profiles", profileUid], state);
    }
};

export const selectLoggedInUserStars = (store: any) => {
    const loggedInUid: string | null = store.LoginReducer.loggedInUid;
    if (loggedInUid) {
        const state: ProfileReducer = store.ProfileReducer;
        return pathOr([], ["profiles", loggedInUid, "starred"], state);
    } else {
        return [];
    }
};

export const selectFilteredUserProjects = (profileUid: string | null) =>
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
                result = fuse.search(projectFilterString);
            }

            // result = result.map((proj: any) => {
            //     const starred = stars.includes(proj.projectUid);
            //     proj.starred = starred;
            //     return proj;
            // });
            return result;
            // return result;
        }
    );

// export const selectUserFollowing = (store: any) => {
//     const state: any = store.ProfileReducer;
//     return state.userFollowing;
// };

export const selectFilteredUserFollowing = (profileUid: string) => store =>
    createSelector(
        [selectUserFollowing(profileUid), selectFollowingFilterString],
        (userFollowing, followingFilterString) => {
            const followingProfiles = userFollowing.map(
                profileUid => selectUserProfile(profileUid)(store) || {}
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

export const selectUserImageURL = (profileUid: string | null) => (
    store: any
) => {
    if (!profileUid) {
        return null;
    } else {
        const state: ProfileReducer = store.ProfileReducer;
        return pathOr([], ["profiles", profileUid, "photoUrl"], state);
    }
};

// export const selectUserImageURLRequesting = (store: any) => {
//     const state: ProfileReducer = store.ProfileReducer;
//     return state.userImageURLRequesting;
// };

// export const selectUserProfileRequesting = (store: any) => {
//     const state: ProfileReducer = store.ProfileReducer;
//     return state.userProfileRequesting;
// };

export const selectCurrentlyPlayingProject = (store: any) => {
    const state: ProfileReducer = store.ProfileReducer;
    return state.currentlyPlayingProject;
};

// export const selectListPlayState = (store: any) => {
//     const state: ProfileReducer = store.ProfileReducer;
//     return state.listPlayState;
// };

// export const selectCsoundStatus = (store: any) => {
//     const state: ProfileReducer = store.ProfileReducer;
//     return state.csoundStatus;
// };

// export const selectPreviousCsoundStatus = (store: any) => {
//     const state: ProfileReducer = store.ProfileReducer;
//     return state.previousCsoundStatus;
// };

// export const selectLoggedInUserFollowing = (store: any) => {
//     const state: any = store.ProfileReducer;
//     return state.loggedInUserFollowing;
// };

export const selectOAuthPhotoURL = (store: any) => {
    const state: any = store.userProfile;
    return state.photoUrl;
};

export const selectCurrentTagText = (store: any) => {
    const state: ProfileReducer = store.ProfileReducer;
    return state.currentTagText;
};

export const selectTags = (projectUid: string) => (store: any) => {
    return pathOr(
        [],
        ["ProjectsReducer", "projects", projectUid, "tags"],
        store
    );
};

export const selectAllUserProjectUids = (profileUid: string | null) => (
    store: any
) => {
    if (!profileUid) {
        return [];
    } else {
        const allUserProjects = values(
            pathOr({}, ["ProjectsReducer", "projects"], store)
        ).filter(p => p.userUid === profileUid);
        return allUserProjects.map(p => p.projectUid);
    }
};

export const selectAllTagsFromUser = (profileUid: string) => (store: any) => {
    return pathOr(
        [],
        ["ProfileReducer", "profiles", profileUid, "allTags"],
        store
    );
};

// export const selectCurrentTagSuggestions = (loggedInUserUid: string) => createSelector(
//     [selectCurrentTagText, selectAllTagsFromUser(loggedInUserUid)],
//     (tagText, allTags) => {
//         const inputValue = tagText.trim().toLowerCase();
//         const inputLength = inputValue.length;
//         let count = 0;

//         const result =
//             inputLength === 0
//                 ? []
//                 : allTags.filter(suggestion => {
//                       const keep =
//                           count < 5 &&
//                           suggestion.toLowerCase().slice(0, inputLength) ===
//                               inputValue;

//                       if (keep) {
//                           count += 1;
//                       }

//                       return keep;
//                   });

//         return [...result];
//     }
// );

// export const selectTagsInput = (store: any) => {
//     const state: ProfileReducer = store.ProfileReducer;

//     return state.tagsInput;
// };

// export const selectPreviousProjectTags = (store: any) => {
//     const state: ProfileReducer = store.ProfileReducer;
//     return state.previousProjectTags;
// };

// export const selectShouldRedirect = (store: any) => {
//     const state: ProfileReducer = store.ProfileReducer;
//     return state.shouldRedirect;
// };
