import { UPDATE_USER_PROFILE } from "@comp/Login/types";
import { SET_CSOUND_PLAY_STATE } from "@comp/Csound/types";
import {
    IProfile,
    ProfileActionTypes,
    SET_CURRENTLY_PLAYING_PROJECT,
    SET_FOLLOWING_FILTER_STRING,
    SET_PROJECT_FILTER_STRING,
    STORE_USER_PROFILE,
    GET_ALL_TAGS,
    UPDATE_PROFILE_FOLLOWING
} from "./types";
import { assoc, assocPath, hasPath, mergeAll, pick, pipe, reduce } from "ramda";

type ProfileMap = { [profileUid: string]: IProfile };

export interface ProfileReducer {
    profiles: ProfileMap;
    readonly currentTagText: string;
    readonly tagsInput: any[];
    readonly currentlyPlayingProject: string | null;
    readonly projectFilterString: string;
    readonly followingFilterString: string;
}

const INITIAL_STATE: ProfileReducer = {
    profiles: {},
    currentTagText: "",
    tagsInput: [],
    currentlyPlayingProject: null,
    projectFilterString: "",
    followingFilterString: ""
};

const profileKeys = [
    "bio",
    "displayName",
    "link1",
    "link2",
    "link3",
    "photoUrl",
    "userUid",
    "username"
];

export default (
    state: ProfileReducer = INITIAL_STATE,
    action: ProfileActionTypes
) => {
    switch (action.type) {
        case SET_FOLLOWING_FILTER_STRING: {
            return assoc("followingFilterString", action.payload, state);
        }
        case SET_PROJECT_FILTER_STRING: {
            return assoc("projectFilterString", action.payload, state);
        }
        case UPDATE_USER_PROFILE: {
            return assocPath(
                ["profiles", (action as any).userUid],
                mergeAll([
                    state.profiles[(action as any).userUid] || {},
                    pick(profileKeys, action.profile || {})
                ]),
                state
            );
        }
        case STORE_USER_PROFILE: {
            if (!hasPath(["profiles", (action as any).profileUid], state)) {
                return assocPath(
                    ["profiles", (action as any).profileUid],
                    action.profile,
                    state
                );
            } else {
                return state;
            }
        }
        case GET_ALL_TAGS: {
            return assocPath(
                ["profiles", (action as any).loggedInUserUid, "allTags"],
                action.allTags,
                state
            );
        }
        case UPDATE_PROFILE_FOLLOWING: {
            return pipe(
                assoc(
                    "profiles",
                    reduce(
                        (acc, item) => assoc(item.userUid, item, acc),
                        state.profiles,
                        action.userProfiles
                    )
                ),
                assocPath(
                    ["profiles", action.profileUid, "following"],
                    (action as any).userProfileUids
                )
            )(state);
        }
        case SET_CURRENTLY_PLAYING_PROJECT: {
            return assoc("currentlyPlayingProject", action.projectUid, state);
        }
        case SET_CSOUND_PLAY_STATE: {
            if (state.currentlyPlayingProject !== null) {
                if (action.status === "stopped") {
                    return assoc("currentlyPlayingProject", null, state);
                }
            }
            return state;
        }
        default: {
            return state;
        }
    }
};
