import { expect, it } from "vitest";
import reducer from "./reducer";
import { STORE_PROFILE_PROJECTS_COUNT, STORE_USER_PROFILE } from "./types";

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
