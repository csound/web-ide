import { UPDATE_USER_PROFILE } from "@comp/login/types";
import { SET_CSOUND_PLAY_STATE } from "@comp/csound/types";
import {
    IProfile,
    ProfileActionTypes,
    SET_CURRENTLY_PLAYING_PROJECT,
    CLOSE_CURRENTLY_PLAYING_PROJECT,
    SET_FOLLOWING_FILTER_STRING,
    SET_PROJECT_FILTER_STRING,
    STORE_USER_PROFILE,
    STORE_PROFILE_PROJECTS_COUNT,
    STORE_PROFILE_STARS,
    GET_ALL_TAGS,
    UPDATE_PROFILE_FOLLOWING,
    UPDATE_PROFILE_FOLLOWERS,
    SET_FOLLOWING_LOADING,
    SET_FOLLOWERS_LOADING,
    SET_STARS_LOADING
} from "./types";

type ProfileMap = { [profileUid: string]: IProfile };

export interface IProfileReducer {
    profiles: ProfileMap;
    readonly currentTagText: string;
    readonly tagsInput: any[];
    readonly currentlyPlayingProject: string | undefined;
    readonly projectFilterString: string;
    readonly followingFilterString: string;
    readonly followingLoading: { [profileUid: string]: boolean };
    readonly followersLoading: { [profileUid: string]: boolean };
    readonly starsLoading: { [profileUid: string]: boolean };
}

const INITIAL_STATE: IProfileReducer = {
    profiles: {},
    currentTagText: "",
    tagsInput: [],
    currentlyPlayingProject: undefined,
    projectFilterString: "",
    followingFilterString: "",
    followingLoading: {},
    followersLoading: {},
    starsLoading: {}
};

const profileKeys = [
    "bio",
    "displayName",
    "link1",
    "link2",
    "link3",
    "themeName",
    "backgroundIndex",
    "photoUrl",
    "userUid",
    "username"
];

const ProfileReducer = (
    state: IProfileReducer = INITIAL_STATE,
    action: ProfileActionTypes
): IProfileReducer => {
    switch (action.type) {
        case SET_FOLLOWING_FILTER_STRING: {
            return { ...state, followingFilterString: action.payload };
        }
        case SET_PROJECT_FILTER_STRING: {
            return { ...state, projectFilterString: action.payload };
        }
        case UPDATE_USER_PROFILE: {
            return {
                ...state,
                profiles: {
                    ...state.profiles,
                    [(action as any).userUid]: {
                        ...(state.profiles[(action as any).userUid] || {}),
                        ...Object.fromEntries(
                            Object.entries(action.profile || {}).filter(
                                ([key]) => profileKeys.includes(key)
                            )
                        )
                    }
                }
            };
        }
        case STORE_USER_PROFILE: {
            const userUid = (action as any).profileUid;
            return state.profiles[userUid]
                ? state
                : {
                      ...state,
                      profiles: {
                          ...state.profiles,
                          [userUid]: action.profile
                      }
                  };
        }
        case GET_ALL_TAGS: {
            return {
                ...state,
                profiles: {
                    ...state.profiles,
                    [action.loggedInUserUid]: {
                        ...state.profiles[action.loggedInUserUid],
                        allTags: action.allTags
                    }
                }
            };
        }
        case STORE_PROFILE_PROJECTS_COUNT: {
            return {
                ...state,
                profiles: {
                    ...state.profiles,
                    [action.profileUid]: {
                        ...state.profiles[action.profileUid],
                        projectsCount: action.projectsCount
                    }
                }
            };
        }
        case STORE_PROFILE_STARS: {
            const sortedStars = Object.keys(action.stars)
                .map((p) => ({
                    timestamp:
                        typeof action.stars[p].toDate === "function"
                            ? action.stars[p].toDate()
                            : action.stars[p].toDate,
                    projectUid: p
                }))
                .sort((x, y) => x.timestamp - y.timestamp);

            return {
                ...state,
                profiles: {
                    ...state.profiles,
                    [action.profileUid]: {
                        ...state.profiles[action.profileUid],
                        stars: sortedStars.map((x) => x.projectUid)
                    }
                }
            };
        }
        case UPDATE_PROFILE_FOLLOWING: {
            const updatedProfiles = action.userProfiles.reduce(
                (accumulator: any, item: any) => ({
                    ...accumulator,
                    [item.userUid]: item
                }),
                state.profiles
            );

            return {
                ...state,
                profiles: {
                    ...updatedProfiles,
                    [action.profileUid]: {
                        ...updatedProfiles[action.profileUid],
                        following: (action as any).userProfileUids
                    }
                }
            };
        }
        case UPDATE_PROFILE_FOLLOWERS: {
            const updatedProfiles = action.userProfiles.reduce(
                (accumulator: any, item: any) => ({
                    ...accumulator,
                    [item.userUid]: item
                }),
                state.profiles
            );

            return {
                ...state,
                profiles: {
                    ...updatedProfiles,
                    [action.profileUid]: {
                        ...updatedProfiles[action.profileUid],
                        followers: (action as any).userProfileUids
                    }
                }
            };
        }
        case SET_CURRENTLY_PLAYING_PROJECT: {
            return { ...state, currentlyPlayingProject: action.projectUid };
        }
        case CLOSE_CURRENTLY_PLAYING_PROJECT: {
            return { ...state, currentlyPlayingProject: undefined };
        }
        case SET_CSOUND_PLAY_STATE: {
            if (state.currentlyPlayingProject && action.status === "stopped") {
                return { ...state, currentlyPlayingProject: undefined };
            }
            return state;
        }
        case SET_FOLLOWING_LOADING: {
            return {
                ...state,
                followingLoading: {
                    ...state.followingLoading,
                    [action.profileUid]: action.isLoading
                }
            };
        }
        case SET_FOLLOWERS_LOADING: {
            return {
                ...state,
                followersLoading: {
                    ...state.followersLoading,
                    [action.profileUid]: action.isLoading
                }
            };
        }
        case SET_STARS_LOADING: {
            return {
                ...state,
                starsLoading: {
                    ...state.starsLoading,
                    [action.profileUid]: action.isLoading
                }
            };
        }
        default: {
            return state;
        }
    }
};

export default ProfileReducer;
