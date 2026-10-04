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
function setup({ empty = false, playlist = false } = {}) {
    const documents = Object.fromEntries(
        Array.from({ length: 100 }, (_, index) => {
            const name = `example-${String(index + 1).padStart(3, "0")}.csd`;
            return [name, { documentUid: name, filename: name }];
        })
    );
    const state = {
        ProjectsReducer: {
            activeProjectUid: "fixture",
            projects: { fixture: { documents } }
        },
        TargetControlsReducer: {
            fixture: {
                defaultTarget: "Main",
                targets: empty
                    ? {}
                    : {
                          ...(playlist
                              ? {
                                    Sequence: {
                                        targetName: "Sequence",
                                        targetType: "playlist",
                                        playlistDocumentsUid: [
                                            "example-002.csd",
                                            "example-003.csd"
                                        ],
                                        csoundOptions: {}
                                    }
                                }
                              : {}),
                          Main: {
                              targetName: "Main",
                              targetType: "main",
                              targetDocumentUid: "example-001.csd"
                          }
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
function selectDocument(combobox: HTMLElement, name: string) {
    fireEvent.keyDown(combobox, { key: "ArrowDown", code: "ArrowDown" });
    fireEvent.click(screen.getByRole("option", { name }));
}
it("saves the last file in a long list as the existing target", () => {
    setup();
    selectDocument(screen.getByRole("combobox"), "example-100.csd");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(saveChangesToTarget).toHaveBeenCalledWith(
        "fixture",
        {
            Main: expect.objectContaining({
                targetDocumentUid: "example-100.csd",
                targetType: "main"
            })
        },
        "Main",
        expect.any(Function)
    );
});
it("lets an owner name and choose a file for a new target before saving", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
    const save = screen.getByRole("button", { name: "Save" });
    expect(save.hasAttribute("disabled")).toBe(true);
    fireEvent.change(screen.getAllByLabelText("target name")[1], {
        target: { value: "Last example" }
    });
    expect(save.hasAttribute("disabled")).toBe(true);
    selectDocument(screen.getAllByRole("combobox")[1], "example-100.csd");
    expect(save.hasAttribute("disabled")).toBe(false);
    fireEvent.click(save);
    expect(saveChangesToTarget).toHaveBeenCalledWith(
        "fixture",
        expect.objectContaining({
            "Last example": expect.objectContaining({
                targetDocumentUid: "example-100.csd",
                targetType: "main"
            })
        }),
        "Main",
        expect.any(Function)
    );
});

it("creates the first target with a default and blocks duplicate new names", () => {
    setup({ empty: true });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.change(screen.getByLabelText("target name"), {
        target: { value: "First" }
    });
    selectDocument(screen.getByRole("combobox"), "example-100.csd");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(saveChangesToTarget).toHaveBeenCalledWith(
        "fixture",
        expect.any(Object),
        "First",
        expect.any(Function)
    );
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.change(screen.getAllByLabelText("target name")[1], {
        target: { value: "First" }
    });
    selectDocument(screen.getAllByRole("combobox")[1], "example-099.csd");
    expect(
        screen.getByRole("button", { name: "Save" }).hasAttribute("disabled")
    ).toBe(true);
    fireEvent.change(screen.getAllByLabelText("target name")[1], {
        target: { value: "Second" }
    });
    expect(
        screen.getByRole("button", { name: "Save" }).hasAttribute("disabled")
    ).toBe(false);
});

it("preserves existing playlists when saving a main target", () => {
    setup({ playlist: true });
    selectDocument(screen.getByRole("combobox"), "example-100.csd");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(saveChangesToTarget).toHaveBeenCalledWith(
        "fixture",
        expect.objectContaining({
            Sequence: {
                targetName: "Sequence",
                targetType: "playlist",
                playlistDocumentsUid: ["example-002.csd", "example-003.csd"],
                csoundOptions: {}
            }
        }),
        "Main",
        expect.any(Function)
    );
});

it("deletes only the chosen new target when two names are still blank", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getAllByRole("combobox")).toHaveLength(3);
    fireEvent.click(
        screen.getAllByRole("button", { name: "Delete target" })[1]
    );
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
});

it("keeps the chosen default when two blank targets later get names", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.click(screen.getAllByRole("radio")[2]);
    expect(
        screen
            .getAllByRole("radio")
            .map((radio) => (radio as HTMLInputElement).checked)
    ).toEqual([false, false, true]);
    fireEvent.change(screen.getAllByLabelText("target name")[1], {
        target: { value: "First added" }
    });
    fireEvent.change(screen.getAllByLabelText("target name")[2], {
        target: { value: "Second added" }
    });
    selectDocument(screen.getAllByRole("combobox")[1], "example-099.csd");
    selectDocument(screen.getAllByRole("combobox")[2], "example-100.csd");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(saveChangesToTarget).toHaveBeenCalledWith(
        "fixture",
        expect.any(Object),
        "Second added",
        expect.any(Function)
    );
});
