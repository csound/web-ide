import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, useLocation } from "react-router";
import { ProfileLists } from "./profile-lists";
import ProfileReducer from "./reducer";
import { STORE_USER_PROFILE } from "./types";

vi.mock("./actions", () => ({ editProject: vi.fn(), deleteProject: vi.fn() }));
vi.mock("../projects/actions", () => ({ markProjectPublic: vi.fn() }));
vi.mock("./list-play-button", () => ({ ListPlayButton: () => null }));
vi.mock("./tabs/stars-list", () => ({ StarsList: () => null }));

afterEach(cleanup);

it.each([
    [true, true, "Public"],
    [true, false, "Private"],
    [false, true, null]
] as const)(
    "shows visibility only to the owner and dates to everyone (owner %s, public %s)",
    (isProfileOwner, isPublic, visibility) => {
        const store = configureStore({ reducer: { ProfileReducer } });
        const { container } = render(
            <Provider store={store}>
                <MemoryRouter>
                    <ProfileLists
                        profileUid="owner"
                        selectedSection={0}
                        isProfileOwner={isProfileOwner}
                        filteredProjects={[
                            {
                                projectUid: "study",
                                userUid: "owner",
                                name: "Sound study",
                                description: "An orchestral sketch",
                                isPublic,
                                created: 1700000000000,
                                cachedProjectLastModified: 1800000000000,
                                documents: {},
                                stars: {},
                                tags: []
                            }
                        ]}
                    />
                </MemoryRouter>
            </Provider>
        );
        expect(
            screen.queryByText(/^(Public|Private)$/)?.textContent ?? null
        ).toBe(visibility);
        expect(screen.getByText(/Created/)).toBeDefined();
        expect(screen.getByText(/Last edited/)).toBeDefined();
        expect(container.querySelectorAll("time")).toHaveLength(2);
    }
);

/** Exposes the in-memory route to check profile links without network access. */
function Location() {
    return <output>{useLocation().pathname}</output>;
}

it.each([
    [1, "following"],
    [2, "followers"]
] as const)(
    "renders profile links for section %s and hides missing profiles",
    (section, relation) => {
        const store = configureStore({ reducer: { ProfileReducer } });
        for (const [profileUid, profile] of Object.entries({
            owner: { [relation]: ["alpha", "missing", "unnamed", "beta"] },
            alpha: {
                userUid: "alpha",
                username: "fixture-alpha",
                displayName: "Fixture Alpha"
            },
            beta: {
                userUid: "beta",
                username: "fixture-beta",
                displayName: "Fixture Beta"
            },
            unnamed: { userUid: "unnamed", displayName: "No username" }
        })) {
            store.dispatch({ type: STORE_USER_PROFILE, profileUid, profile });
        }
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <ProfileLists
                        profileUid="owner"
                        selectedSection={section}
                        isProfileOwner={false}
                        filteredProjects={[]}
                    />
                    <Location />
                </MemoryRouter>
            </Provider>
        );
        expect(
            screen.getAllByRole("button").map((button) => button.textContent)
        ).toEqual(["Fixture Alpha", "Fixture Beta"]);
        fireEvent.click(screen.getByRole("button", { name: "Fixture Alpha" }));
        expect(screen.getByRole("status").textContent).toBe(
            "/profile/fixture-alpha"
        );
        fireEvent.click(screen.getByRole("button", { name: "Fixture Beta" }));
        expect(screen.getByRole("status").textContent).toBe(
            "/profile/fixture-beta"
        );
    }
);

it.each([
    [1, "following", "No Following Yet"],
    [2, "followers", "No Followers Yet"]
] as const)(
    "shows an empty list for section %s when all profiles are missing",
    (section, relation, message) => {
        const store = configureStore({ reducer: { ProfileReducer } });
        store.dispatch({
            type: STORE_USER_PROFILE,
            profileUid: "owner",
            profile: { [relation]: ["missing"] }
        });
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <ProfileLists
                        profileUid="owner"
                        selectedSection={section}
                        isProfileOwner={false}
                        filteredProjects={[]}
                    />
                </MemoryRouter>
            </Provider>
        );
        expect(screen.queryAllByRole("button")).toHaveLength(0);
        expect(screen.getByText(message)).toBeDefined();
    }
);
