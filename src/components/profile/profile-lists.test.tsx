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
            owner: { [relation]: ["steven", "missing", "unnamed", "eddie"] },
            steven: {
                userUid: "steven",
                username: "stevenyi",
                displayName: "Steven Yi"
            },
            eddie: {
                userUid: "eddie",
                username: "eddyc",
                displayName: "Ed Costello"
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
        ).toEqual(["Steven Yi", "Ed Costello"]);
        fireEvent.click(screen.getByRole("button", { name: "Steven Yi" }));
        expect(screen.getByRole("status").textContent).toBe(
            "/profile/stevenyi"
        );
        fireEvent.click(screen.getByRole("button", { name: "Ed Costello" }));
        expect(screen.getByRole("status").textContent).toBe("/profile/eddyc");
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
