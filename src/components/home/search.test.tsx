import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { legacy_createStore } from "redux";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import palette from "../../styles/_theme-monokai";
import Search from "./search";

vi.mock("./actions", () => ({ searchProjects: vi.fn() }));
vi.mock("../profile/list-play-button", () => ({ ListPlayButton: () => null }));
vi.mock("../../elements/project-avatar", () => ({ default: () => null }));
afterEach(cleanup);

it.each([undefined, "", "fixture-author"])(
    "keeps completed search results visible when the author username is %j",
    (username) => {
        const store = legacy_createStore(() => ({
            HomeReducer: {
                searchQuery: "test",
                searchProjectsRequest: false,
                searchPaginationOffset: 0,
                searchResultTotalRecords: 1,
                searchResult: [
                    {
                        projectUid: "project1",
                        userUid: "author",
                        name: "Test project",
                        description: "Keep this description"
                    }
                ],
                profiles:
                    username === undefined
                        ? {}
                        : { author: { username, displayName: "Test author" } }
            }
        }));
        const { container } = render(
            <Provider store={store}>
                <MemoryRouter>
                    <ThemeProvider
                        theme={createTheme({
                            ...palette,
                            font: {
                                monospace: "monospace",
                                regular: "sans-serif"
                            }
                        })}
                    >
                        <Search />
                    </ThemeProvider>
                </MemoryRouter>
            </Provider>
        );
        expect(
            screen
                .getByRole("link", { name: /Test project/ })
                .getAttribute("href")
        ).toBe("/editor/project1");
        expect(screen.getByText("Keep this description")).toBeTruthy();
        expect(container.querySelector(".skeleton-name")).toBeNull();
        const authorLinks = screen
            .getAllByRole("link")
            .filter((link) =>
                link.getAttribute("href")?.startsWith("/profile/")
            );
        expect(authorLinks.map((link) => link.getAttribute("href"))).toEqual(
            username ? ["/profile/fixture-author"] : []
        );
    }
);
