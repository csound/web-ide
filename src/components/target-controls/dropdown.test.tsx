import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import palette from "../../styles/_theme-monokai";
import TargetDropdown from "./dropdown";
import TargetControlsReducer from "./reducer";

afterEach(cleanup);
function setup(owner: boolean, playing = false, mode = "playlist") {
    const controls = {
        project: {
            defaultTarget: "Playlist",
            selectedTarget: "Playlist",
            selectedTargetPlaylistIndex: 1,
            targets: {
                Playlist: {
                    targetName: "Playlist",
                    targetType: mode,
                    targetDocumentUid: "first",
                    playlistDocumentsUid: ["first", "second"],
                    csoundOptions: {}
                }
            }
        }
    };
    const state = {
        LoginReducer: { loggedInUid: owner ? "owner" : undefined },
        csound: { status: playing ? "playing" : "stopped" },
        ProjectsReducer: {
            projects: {
                project: {
                    userUid: "owner",
                    documents: {
                        first: {
                            documentUid: "first",
                            filename: "first.csd",
                            type: "txt",
                            path: []
                        },
                        second: {
                            documentUid: "second",
                            filename: "second.orc",
                            type: "txt",
                            path: []
                        }
                    }
                }
            }
        },
        TargetControlsReducer: controls
    };
    const store = configureStore({
        reducer: (current = state, action) => ({
            ...current,
            TargetControlsReducer: TargetControlsReducer(
                current.TargetControlsReducer,
                action
            )
        })
    });
    render(
        <Provider store={store}>
            <ThemeProvider
                theme={createTheme({
                    ...palette,
                    font: { regular: "sans-serif", monospace: "monospace" }
                })}
            >
                <TargetDropdown activeProjectUid="project" />
            </ThemeProvider>
        </Provider>
    );
    return store;
}
it("lets guests choose a starting track without offering project settings", () => {
    const store = setup(false);
    expect(
        screen.queryByRole("button", { name: "Playback settings" })
    ).toBeNull();
    fireEvent.mouseDown(
        screen.getByRole("combobox", { name: "Start playlist from" })
    );
    fireEvent.click(screen.getByRole("option", { name: "1. first.csd" }));
    expect(
        store.getState().TargetControlsReducer.project
            .selectedTargetPlaylistIndex
    ).toBe(0);
});
it("shows the current entry during playback and settings for owners", () => {
    setup(true, true);
    expect(
        screen
            .getByRole("combobox", { name: "Current playlist track" })
            .getAttribute("aria-disabled")
    ).toBe("true");
    expect(screen.getByRole("combobox").textContent).toContain(
        "2/2 · second.orc"
    );
    expect(
        screen.getByRole("button", { name: "Playback settings" })
    ).toBeTruthy();
});

it.each([true, false])(
    "hides filenames and track selection in main mode (owner: %s)",
    (owner) => {
        setup(owner, false, "main");
        expect(screen.queryByText("first.csd")).toBeNull();
        expect(screen.queryByRole("combobox")).toBeNull();
        expect(
            !!screen.queryByRole("button", { name: "Playback settings" })
        ).toBe(owner);
    }
);
