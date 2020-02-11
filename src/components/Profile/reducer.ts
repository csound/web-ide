import { UPDATE_USER_PROFILE } from "@comp/Login/types";
import {
    IProfile,
    ProfileActionTypes,
    STORE_USER_PROFILE,
    GET_ALL_TAGS,
    UPDATE_PROFILE_FOLLOWING
} from "./types";
import { assoc, assocPath, pipe, reduce } from "ramda";
// import facePng from "./face.png";

type ProfileMap = { [profileUid: string]: IProfile };

export interface ProfileReducer {
    profiles: ProfileMap;
    readonly currentTagText: string;
    readonly tagsInput: any[];
    readonly currentlyPlayingProject: string | false;
    readonly projectFilterString: string;
    readonly followingFilterString: string;
}

const INITIAL_STATE: ProfileReducer = {
    profiles: {},
    currentTagText: "",
    tagsInput: [],
    currentlyPlayingProject: false,
    projectFilterString: "",
    followingFilterString: ""
};

export default (
    state: ProfileReducer = INITIAL_STATE,
    action: ProfileActionTypes
) => {
    switch (action.type) {
        case UPDATE_USER_PROFILE: {
            return assocPath(
                ["profiles", (action as any).userUid],
                (action as any).profile,
                state
            );
        }
        case STORE_USER_PROFILE: {
            return assocPath(
                ["profiles", (action as any).profileUid],
                (action as any).profile,
                state
            );
        }
        case GET_ALL_TAGS: {
            return assocPath(
                ["profiles", (action as any).loggedInUserUid, "allTags"],
                (action as any).allTags,
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
                        (action as any).userProfiles
                    )
                ),
                assocPath(
                    ["profiles", (action as any).profileUid, "following"],
                    (action as any).userProfileUids
                )
            )(state);
        }
        default: {
            return state;
        }
    }
};
