import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import palette from "../../../styles/_theme-monokai";
import { TargetControlsConfigDialog } from "./index";
import { saveChangesToTarget } from "../actions";

vi.mock("../actions", () => ({
    saveChangesToTarget: vi.fn(() => ({ type: "test/save-targets" }))
}));
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});
function setup({
    empty = false,
    playlist = false,
    busy = false,
    legacy = false
} = {}) {
    const documents = Object.fromEntries(
        Array.from({ length: empty ? 0 : 100 }, (_, index) => {
            const name = `example-${String(index + 1).padStart(3, "0")}.csd`;
            return [
                name,
                { documentUid: name, filename: name, type: "txt", path: [] }
            ];
        })
    );
    const state = {
        csound: { status: busy ? "playing" : "stopped" },
        ProjectsReducer: {
            activeProjectUid: "fixture",
            projects: { fixture: { documents } }
        },
        TargetControlsReducer: {
            fixture: {
                defaultTarget: "Main",
                targets: {
                    Main: {
                        targetName: "Main",
                        targetType: playlist ? "playlist" : "main",
                        targetDocumentUid: "example-001.csd",
                        playlistDocumentsUid: playlist
                            ? ["example-002.csd", "example-003.csd"]
                            : [],
                        csoundOptions: {}
                    },
                    ...(legacy
                        ? {
                              old: {
                                  targetName: "old",
                                  targetType: "main",
                                  targetDocumentUid: "example-004.csd"
                              }
                          }
                        : {})
                }
            }
        }
    };
    render(
        <Provider store={configureStore({ reducer: () => state })}>
            <ThemeProvider
                theme={createTheme({
                    ...palette,
                    font: { regular: "sans-serif", monospace: "monospace" }
                })}
            >
                <TargetControlsConfigDialog />
            </ThemeProvider>
        </Provider>
    );
}
function choose(label: string, name: string) {
    fireEvent.keyDown(screen.getByRole("combobox", { name: label }), {
        key: "ArrowDown",
        code: "ArrowDown"
    });
    fireEvent.click(screen.getByRole("option", { name }));
}
it("replaces legacy targets with exactly one main file selected from a long list", () => {
    setup({ legacy: true });
    choose("Main file", "example-100.csd");
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(saveChangesToTarget).toHaveBeenCalledWith(
        "fixture",
        {
            Main: {
                targetName: "Main",
                targetType: "main",
                targetDocumentUid: "example-100.csd",
                csoundOptions: {}
            }
        },
        "Main",
        expect.any(Function)
    );
});
it("adds, reorders, removes and saves a playlist without duplicate entries", () => {
    setup();
    fireEvent.click(
        screen.getByRole("button", { name: "Playlist", exact: true })
    );
    expect(
        screen
            .getByRole("button", { name: "Save changes" })
            .hasAttribute("disabled")
    ).toBe(true);
    choose("Add a track", "example-001.csd");
    choose("Add a track", "example-002.csd");
    choose("Add a track", "example-003.csd");
    fireEvent.click(
        screen.getByRole("button", { name: "Move example-003.csd up" })
    );
    fireEvent.click(
        screen.getByRole("button", {
            name: "Remove example-001.csd from playlist"
        })
    );
    fireEvent.keyDown(screen.getByRole("combobox", { name: "Add a track" }), {
        key: "ArrowDown",
        code: "ArrowDown"
    });
    expect(
        screen.queryByRole("option", { name: "example-002.csd" })
    ).toBeNull();
    fireEvent.keyDown(screen.getByRole("combobox", { name: "Add a track" }), {
        key: "Escape"
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(saveChangesToTarget).toHaveBeenCalledWith(
        "fixture",
        {
            Playlist: {
                targetName: "Playlist",
                targetType: "playlist",
                playlistDocumentsUid: ["example-003.csd", "example-002.csd"],
                csoundOptions: {}
            }
        },
        "Playlist",
        expect.any(Function)
    );
});
it("switches back to one main file without saving stale playlist fields", () => {
    setup({ playlist: true });
    fireEvent.click(
        screen.getByRole("button", { name: "Main file", exact: true })
    );
    choose("Main file", "example-099.csd");
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(saveChangesToTarget).toHaveBeenCalledWith(
        "fixture",
        {
            Main: {
                targetName: "Main",
                targetType: "main",
                targetDocumentUid: "example-099.csd",
                csoundOptions: {}
            }
        },
        "Main",
        expect.any(Function)
    );
});
it.each([{ empty: true }, { busy: true }])(
    "prevents unusable config changes: %j",
    (options) => {
        setup(options);
        expect(
            screen
                .getByRole("button", { name: "Save changes" })
                .hasAttribute("disabled")
        ).toBe(true);
    }
);
