import { afterEach, expect, it, vi } from "vitest";
import {
    cleanup,
    fireEvent,
    render,
    screen,
    within
} from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import palette from "../../styles/_theme-monokai";
import ProfileReducer from "./reducer";
import { ProfileProjects } from "./profile-projects";
import type { IProject } from "../projects/types";

vi.mock("./actions", () => ({
    setProjectFilterString: (payload: string) => ({
        type: "PROFILE.SET_PROJECT_FILTER_STRING",
        payload
    }),
    addProject: () => ({ type: "test/add" }),
    editProject: vi.fn(),
    deleteProject: vi.fn()
}));
vi.mock("../projects/actions", () => ({ markProjectPublic: vi.fn() }));
vi.mock("./list-play-button", () => ({ ListPlayButton: () => null }));
vi.mock("./tabs/stars-list", () => ({ StarsList: () => null }));
afterEach(cleanup);
const project = (
    name: string,
    tags: string[],
    description = "",
    isPublic = true
): IProject => ({
    name,
    projectUid: name,
    tags,
    description,
    isPublic,
    userUid: "fixture",
    created: 1700000000000,
    documents: {},
    stars: {}
});
const projects = [
    project("Glass bells", ["synthesis", "ambient"], "Soft tones"),
    project("Granular study", ["synthesis", "granular"]),
    project("Étude", ["ambient"]),
    project("Private sketch", ["private-tag"], "", false)
];
function setup(owner = false) {
    const store = configureStore({ reducer: { ProfileReducer } });
    render(
        <Provider store={store}>
            <MemoryRouter>
                <ThemeProvider
                    theme={createTheme({
                        ...palette,
                        font: { regular: "sans-serif", monospace: "monospace" }
                    })}
                >
                    <ProfileProjects
                        profileUid="fixture"
                        projects={projects}
                        isProfileOwner={owner}
                    />
                </ThemeProvider>
            </MemoryRouter>
        </Provider>
    );
}
const names = () =>
    screen
        .queryAllByRole("heading", { level: 2 })
        .map((node) => node.textContent);
const chooseTag = (name: string) => {
    fireEvent.keyDown(
        screen.getByRole("combobox", { name: "Filter by tags" }),
        { key: "ArrowDown" }
    );
    fireEvent.click(screen.getByRole("option", { name }));
};
it("shows project tags and puts each date beside its title, outside the link", () => {
    setup();
    const title = screen.getByRole("heading", { name: "Glass bells" });
    const row = title.closest("li")!;
    expect(within(row).getByText("synthesis")).toBeDefined();
    expect(within(row).getByText("ambient")).toBeDefined();
    const date = within(row).getByRole("button", {
        name: /Created .*Show project dates/
    });
    expect(
        date.closest('[data-testid="project-title-row"]')?.contains(title)
    ).toBe(true);
    expect(date.closest("a")).toBeNull();
});
it("combines text search and all selected tags, then clears both", () => {
    setup();
    chooseTag("synthesis");
    expect(names()).toEqual(["Glass bells", "Granular study"]);
    chooseTag("ambient");
    expect(names()).toEqual(["Glass bells"]);
    expect(screen.getByRole("status").textContent).toContain(
        "matching all selected tags"
    );
    fireEvent.change(screen.getByRole("searchbox"), {
        target: { value: "missing" }
    });
    expect(screen.getByText("No matching projects")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(names()).toEqual(["Glass bells", "Granular study", "Étude"]);
});
it.each([
    ["soft", ["Glass bells"]],
    ["GRANULAR", ["Granular study"]],
    ["etude", ["Étude"]],
    ["ambient", ["Glass bells", "Étude"]]
])("searches titles, descriptions and tags: %s", (query, expected) => {
    setup();
    fireEvent.change(screen.getByRole("searchbox"), {
        target: { value: query }
    });
    expect(names()).toEqual(expected);
});
it.each([false, true])(
    "offers only visible project tags (owner: %s)",
    (owner) => {
        setup(owner);
        fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
        expect(!!screen.queryByRole("option", { name: "private-tag" })).toBe(
            owner
        );
        expect(
            !!screen.queryByRole("heading", { name: "Private sketch" })
        ).toBe(owner);
    }
);
