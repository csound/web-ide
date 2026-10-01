import { expect, it } from "vitest";
import reducer from "./reducer";
import {
    STORE_PROFILE_PROJECTS_COUNT,
    STORE_USER_PROFILE,
    UPDATE_PROFILE_FOLLOWING,
    UPDATE_PROFILE_FOLLOWERS
} from "./types";

it("loads and refreshes usernames even when project counts arrived first", () => {
    const state = reducer(undefined, {
        type: STORE_PROFILE_PROJECTS_COUNT,
        profileUid: "author",
        projectsCount: { all: 2, public: 1 }
    });
    const loaded = reducer(state, {
        type: STORE_USER_PROFILE,
        profileUid: "author",
        profile: { username: "author", displayName: "An author" }
    });
    const updated = reducer(loaded, {
        type: STORE_USER_PROFILE,
        profileUid: "author",
        profile: { username: "chosenName", displayName: "An author" }
    });
    expect(updated.profiles.author).toMatchObject({
        username: "chosenName",
        displayName: "An author",
        projectsCount: { all: 2, public: 1 }
    });
});

it.each([UPDATE_PROFILE_FOLLOWING, UPDATE_PROFILE_FOLLOWERS])(
    "keeps loaded lists when %s refreshes a related profile",
    (type) => {
        const state = reducer(undefined, {
            type: STORE_USER_PROFILE,
            profileUid: "related",
            profile: {
                following: ["friend"],
                followers: ["owner"],
                projectsCount: { all: 2, public: 1 }
            }
        });
        const updated = reducer(state, {
            type,
            profileUid: "owner",
            userProfileUids: ["related"],
            userProfiles: [{ userUid: "related", username: "current" }]
        });
        expect(updated.profiles.related).toMatchObject({
            username: "current",
            following: ["friend"],
            followers: ["owner"],
            projectsCount: { all: 2, public: 1 }
        });
    }
);
