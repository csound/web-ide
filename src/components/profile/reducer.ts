import { UPDATE_USER_PROFILE } from "@comp/login/types";
import { SET_CSOUND_PLAY_STATE } from "@comp/csound/types";
import {
    IProfile,
    ProfileActionTypes,
    SET_CURRENTLY_PLAYING_PROJECT,
    SET_FOLLOWING_FILTER_STRING,
    SET_PROJECT_FILTER_STRING,
    STORE_USER_PROFILE,
    STORE_PROFILE_PROJECTS_COUNT,
    STORE_PROFILE_STARS,
    GET_ALL_TAGS,
    UPDATE_PROFILE_FOLLOWING,
    UPDATE_PROFILE_FOLLOWERS
} from "./types";
import {
    assoc,
    assocPath,
    dissoc,
    hasPath,
    keys,
    mergeAll,
    pick,
    pipe,
    reduce,
    sort
} from "ramda";

type ProfileMap = { [profileUid: string]: IProfile };

export interface IProfileReducer {
    profiles: ProfileMap;
    readonly currentTagText: string;
    readonly tagsInput: any[];
    readonly currentlyPlayingProject: string | undefined;
    readonly projectFilterString: string;
    readonly followingFilterString: string;
}

const INITIAL_STATE: IProfileReducer = {
    profiles: {},
    currentTagText: "",
    tagsInput: [],
    currentlyPlayingProject: undefined,
    projectFilterString: "",
    followingFilterString: ""
};

const profileKeys = [
    "bio",
    "displayName",
    "link1",
    "link2",
    "link3",
    "backgroundIndex",
    "photoUrl",
    "userUid",
    "username"
];

const ProfileReducer = (
    state: IProfileReducer = INITIAL_STATE,
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
            return !hasPath(["profiles", (action as any).profileUid], state)
                ? assocPath(
                      ["profiles", (action as any).profileUid],
                      action.profile,
                      state
                  )
                : state;
        }
        case GET_ALL_TAGS: {
            return assocPath(
                ["profiles", action.loggedInUserUid, "allTags"],
                action.allTags,
                state
            );
        }
        case STORE_PROFILE_PROJECTS_COUNT: {
            return assocPath(
                ["profiles", action.profileUid, "projectsCount"],
                action.projectsCount,
                state
            );
        }
        case STORE_PROFILE_STARS: {
            const sortedStars = sort(
                (x) => x.timestamp,
                keys(action.stars).map((p) => ({
                    timestamp: action.stars[p].toDate,
                    projectUid: p
                }))
            );
            return assocPath(
                ["profiles", action.profileUid, "stars"],
                sortedStars.map((x) => x.projectUid),
                state
            );
        }
        case UPDATE_PROFILE_FOLLOWING: {
            return pipe(
                assoc(
                    "profiles",
                    reduce(
                        (accumulator, item) =>
                            assoc(item.userUid, item, accumulator),
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
        case UPDATE_PROFILE_FOLLOWERS: {
            return pipe(
                assoc(
                    "profiles",
                    reduce(
                        (accumulator, item) =>
                            assoc(item.userUid, item, accumulator),
                        state.profiles,
                        action.userProfiles
                    )
                ),
                assocPath(
                    ["profiles", action.profileUid, "followers"],
                    (action as any).userProfileUids
                )
            )(state);
        }
        case SET_CURRENTLY_PLAYING_PROJECT: {
            return assoc("currentlyPlayingProject", action.projectUid, state);
        }
        case SET_CSOUND_PLAY_STATE: {
            if (state.currentlyPlayingProject && action.status === "stopped") {
                return dissoc("currentlyPlayingProject", state);
            }
            return state;
        }
        default: {
            return state;
        }
    }
};

export default ProfileReducer;
