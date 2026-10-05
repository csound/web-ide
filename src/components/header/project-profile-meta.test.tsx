import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { legacy_createStore } from "redux";
import { MemoryRouter, useLocation } from "react-router";
import ProjectProfileMeta from "./project-profile-meta";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import theme from "../../styles/_theme-monokai";

afterEach(cleanup);

it.each([undefined, "", "author123"])(
    "handles username %j in the author link",
    (username) => {
        const store = legacy_createStore(() => ({
            ProjectsReducer: {
                activeProjectUid: "project1",
                projects: {
                    project1: {
                        projectUid: "project1",
                        userUid: "author123",
                        name: "Test"
                    }
                }
            },
            ProfileReducer: {
                profiles: {
                    author123: { displayName: "Aldrin Salazar", username }
                }
            }
        }));
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <ThemeProvider
                        theme={createTheme({
                            ...theme,
                            font: { regular: "sans-serif" }
                        })}
                    >
                        <ProjectProfileMeta />
                    </ThemeProvider>
                </MemoryRouter>
            </Provider>
        );
        expect(screen.getByText("Aldrin Salazar")).toBeTruthy();
        const link = screen.queryByRole("link", { name: "Aldrin Salazar" });
        if (username)
            expect(link?.getAttribute("href")).toBe("/profile/author123");
        else expect(link).toBeNull();
    }
);

const Location = () => <output>{useLocation().pathname}</output>;

it.each([
    ["", "Josue_mts"],
    ["   ", "Josue_mts"],
    [null, "Josue_mts"],
    [undefined, "Josue_mts"],
    ["Josue", "Josue"]
])("links the author when displayName is %j", (displayName, label) => {
    const store = legacy_createStore(() => ({
        ProjectsReducer: {
            activeProjectUid: "project",
            projects: {
                project: {
                    projectUid: "project",
                    userUid: "owner",
                    name: "New Project"
                }
            }
        },
        ProfileReducer: {
            profiles: { owner: { username: "Josue_mts", displayName } }
        }
    }));
    render(
        <Provider store={store}>
            <MemoryRouter initialEntries={["/editor/project"]}>
                <ThemeProvider
                    theme={createTheme({
                        ...theme,
                        font: { monospace: "monospace", regular: "sans-serif" }
                    })}
                >
                    <ProjectProfileMeta />
                    <Location />
                </ThemeProvider>
            </MemoryRouter>
        </Provider>
    );
    const link = screen.getByRole("link", { name: label });
    expect(link.getAttribute("href")).toBe("/profile/Josue_mts");
    fireEvent.click(link);
    expect(screen.getByText("/profile/Josue_mts")).toBeTruthy();
});
