import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { legacy_createStore } from "redux";
import { MemoryRouter } from "react-router";
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
