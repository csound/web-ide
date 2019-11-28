import { createSelector } from "reselect";
import { State } from "./reducer";

export const selectUserProjects = (store: any) => {
    const state: State = store.ProfileReducer;
    return state.userProjects;
};

export const selectUserProfile = (store: any) => {
    const state: State = store.ProfileReducer;
    return state.userProfile;
};

export const selectUserImageURL = (store: any) => {
    const state: State = store.ProfileReducer;
    return state.userImageURL;
};

export const selectProfileUid = (store: any) => {
    const state: State = store.ProfileReducer;
    return state.profileUid;
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

export const selectProfileLinks = createSelector(
    [selectUserProfile],
    userProfile => {
        console.log(userProfile);
    }
);

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
