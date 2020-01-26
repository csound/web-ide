import { createSelector } from "reselect";
import { State } from "./reducer";
import Fuse from "fuse.js";
export const selectUserProfilesForFollowing = (store: any) => {
    const state: State = store.ProfileReducer;
    return state.userProfilesForFollowing;
};
export const selectUserProjects = (store: any) => {
    const state: State = store.ProfileReducer;
    return state.userProjects;
};

export const selectStarProjectRequesting = (store: any) => {
    const state: State = store.ProfileReducer;
    return state.starProjectRequesting;
};

export const selectProjectFilterString = (store: any) => {
    const state: State = store.ProfileReducer;
    return state.projectFilterString;
};

export const selectFollowingFilterString = (store: any) => {
    const state: State = store.ProfileReducer;
    return state.followingFilterString;
};

export const selectUserProfile = (store: any) => {
    const state: State = store.ProfileReducer;
    return state.userProfile;
};

export const selectLoggedInUserStars = (store: any) => {
    const state: State = store.ProfileReducer;
    return state.loggedInUserStars;
};

export const selectFilteredUserProjects = createSelector(
    [selectUserProjects, selectProjectFilterString, selectLoggedInUserStars],
    (userProjects, projectFilterString, stars) => {
        let result: any = [];

        if (userProjects === false) {
            return [];
        }
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

        result = result.map((proj: any) => {
            const starred = stars.includes(proj.projectUid);
            proj.starred = starred;
            return proj;
        });

        return result;
    }
);

export const selectUserFollowing = (store: any) => {
    const state: any = store.ProfileReducer;
    return state.userFollowing;
};

export const selectFilteredUserFollowing = createSelector(
    [selectUserProfilesForFollowing, selectFollowingFilterString],
    (userFollowing, followingFilterString) => {
        if (
            typeof followingFilterString === "undefined" ||
            followingFilterString === ""
        ) {
            return userFollowing;
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
        const fuse = new Fuse(userFollowing, options);
        const result = fuse.search(followingFilterString);
        return result;
    }
);

export const selectUserImageURL = (store: any) => {
    const state: State = store.ProfileReducer;
    return state.userImageURL;
};

export const selectUserImageURLRequesting = (store: any) => {
    const state: State = store.ProfileReducer;
    return state.userImageURLRequesting;
};

export const selectUserProfileRequesting = (store: any) => {
    const state: State = store.ProfileReducer;
    return state.userProfileRequesting;
};

export const selectCurrentlyPlayingProject = (store: any) => {
    const state: State = store.ProfileReducer;
    return state.currentlyPlayingProject;
};

export const selectListPlayState = (store: any) => {
    const state: State = store.ProfileReducer;
    return state.listPlayState;
};

export const selectCsoundStatus = (store: any) => {
    const state: State = store.ProfileReducer;
    return state.csoundStatus;
};

export const selectPreviousCsoundStatus = (store: any) => {
    const state: State = store.ProfileReducer;
    return state.previousCsoundStatus;
};

export const selectLoggedInUserFollowing = (store: any) => {
    const state: any = store.ProfileReducer;
    return state.loggedInUserFollowing;
};

export const selectOAuthPhotoURL = (store: any) => {
    const state: any = store.userProfile;
    return state.photoUrl;
};

export const selectCurrentTagText = (store: any) => {
    const state: State = store.ProfileReducer;
    return state.currentTagText;
};

export const selectTags = (store: any) => {
    const state: State = store.ProfileReducer;
    return state.tags;
};

export const selectCurrentTagSuggestions = createSelector(
    [selectCurrentTagText, selectTags],
    (tagText, tagSuggestions) => {
        const inputValue = tagText.trim().toLowerCase();
        const inputLength = inputValue.length;
        let count = 0;

        const result =
            inputLength === 0
                ? []
                : tagSuggestions.filter(suggestion => {
                      const keep =
                          count < 5 &&
                          suggestion.toLowerCase().slice(0, inputLength) ===
                              inputValue;

                      if (keep) {
                          count += 1;
                      }

                      return keep;
                  });

        return [...result];
    }
);

export const selectIsUserProfileOwner = (store: any) => {
    const state: State = store.ProfileReducer;
    const { loggedInUid, profileUid } = state;
    if (loggedInUid === null || profileUid === null) {
        return false;
    }
    return state.loggedInUid === state.profileUid;
};

export const selectTagsInput = (store: any) => {
    const state: State = store.ProfileReducer;

    return state.tagsInput;
};

export const selectPreviousProjectTags = (store: any) => {
    const state: State = store.ProfileReducer;

    return state.previousProjectTags;
};

export const selectShouldRedirect = (store: any) => {
    const state: State = store.ProfileReducer;
    return state.shouldRedirect;
};
