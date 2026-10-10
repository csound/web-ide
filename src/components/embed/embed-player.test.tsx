import { StrictMode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor
} from "@testing-library/react";
import { Provider } from "react-redux";
import { store } from "../../store";
import ThemeProvider from "../../styles/theme-provider";
import { generateEmptyDocument } from "../projects/utils";
import { IProject } from "../projects/types";
import { nonCloudFiles } from "../file-tree/actions";
import { runPerformance, stopPerformance } from "../csound/actions";
import { loadEmbedProject } from "./load-project";
import { EmbedPlayer } from "./embed-player";

vi.mock("./load-project", async (importOriginal) => ({
    ...(await importOriginal<typeof import("./load-project")>()),
    loadEmbedProject: vi.fn()
}));
vi.mock("../csound/actions", async (importOriginal) => ({
    ...(await importOriginal<typeof import("../csound/actions")>()),
    runPerformance: vi.fn(),
    stopPerformance: vi.fn(async () => undefined)
}));

const project: IProject = {
    projectUid: "embed-test",
    name: "Glass study",
    description: "A short piece",
    isPublic: true,
    userUid: "composer",
    tags: [],
    stars: {},
    documents: {
        main: {
            ...generateEmptyDocument("main", "project.csd"),
            currentValue: "<CsOptions>-odac</CsOptions>"
        },
        alternate: generateEmptyDocument("alternate", "alternate.orc")
    }
};
const show = () =>
    render(
        <StrictMode>
            <Provider store={store}>
                <ThemeProvider>
                    <EmbedPlayer projectUid="embed-test" />
                </ThemeProvider>
            </Provider>
        </StrictMode>
    );

beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch({ type: "CSOUND.SET_CSOUND_PLAY_STATE", status: "stopped" });
    vi.mocked(loadEmbedProject).mockResolvedValue({
        project,
        documentUid: "main"
    });
    vi.mocked(runPerformance).mockResolvedValue({
        status: "playing",
        files: []
    });
    vi.stubGlobal(
        "URL",
        Object.assign(URL, {
            createObjectURL: vi.fn(() => "blob:rendered"),
            revokeObjectURL: vi.fn()
        })
    );
});
afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

it("waits for a click, allows file selection, and disables SAB in the frame", async () => {
    show();
    expect(screen.getByText("Loading project…")).toBeTruthy();
    await screen.findByRole("heading", { name: "Glass study" });
    expect(runPerformance).not.toHaveBeenCalled();
    expect(
        screen.getByRole("link", { name: "Open in IDE" }).getAttribute("target")
    ).toBe("_blank");
    fireEvent.change(screen.getByRole("combobox", { name: "File" }), {
        target: { value: "alternate" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    await waitFor(() =>
        expect(runPerformance).toHaveBeenCalledWith(
            expect.objectContaining({
                projectUid: "embed-test",
                orcPath: "alternate.orc",
                mode: "auto",
                useSAB: false
            })
        )
    );
});

it("cancels startup and rendering when the player unmounts", async () => {
    const view = show();
    fireEvent.click(await screen.findByRole("button", { name: "Play" }));
    const signal = vi.mocked(runPerformance).mock.calls[0][0].signal!;
    expect(signal.aborted).toBe(false);
    view.unmount();
    expect(signal.aborted).toBe(true);
    expect(
        store.getState().ProjectsReducer.projects["embed-test"]
    ).toBeUndefined();
});

it("shows render output and revokes its URL when the file changes", async () => {
    vi.mocked(runPerformance).mockImplementation(async () => {
        nonCloudFiles.set("piece.wav", {
            name: "piece.wav",
            buffer: new Uint8Array([82, 73, 70, 70]),
            createdAt: new Date()
        });
        return { status: "completed", files: ["piece.wav"] };
    });
    show();
    fireEvent.click(
        await screen.findByRole("button", { name: "Render audio" })
    );
    const download = await screen.findByRole("link", {
        name: "Download piece.wav"
    });
    expect(download.getAttribute("download")).toBe("piece.wav");
    expect(screen.getByLabelText("Rendered audio: piece.wav")).toBeTruthy();
    fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "alternate" }
    });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:rendered");
});

it("keeps Stop available during startup and renders", async () => {
    show();
    await screen.findByRole("button", { name: "Play" });
    act(() => {
        store.dispatch({
            type: "CSOUND.SET_CSOUND_PLAY_STATE",
            status: "loading"
        });
    });
    expect(
        (screen.getByRole("button", { name: "Play" }) as HTMLButtonElement)
            .disabled
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(stopPerformance).toHaveBeenCalledOnce();
});

it("shows startup errors and permits a retry", async () => {
    vi.mocked(runPerformance).mockRejectedValue(
        new Error("Csound compilation failed.")
    );
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Play" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
        "compilation failed"
    );
    expect(
        (screen.getByRole("button", { name: "Play" }) as HTMLButtonElement)
            .disabled
    ).toBe(false);
});

it("shows unavailable projects without playback controls", async () => {
    vi.mocked(loadEmbedProject).mockRejectedValue(
        new Error("This project is private or no longer exists.")
    );
    show();
    expect((await screen.findByRole("alert")).textContent).toContain("private");
    expect(screen.queryByRole("button", { name: "Play" })).toBeNull();
});

it("shows an empty state for projects without playable files", async () => {
    vi.mocked(loadEmbedProject).mockResolvedValue({
        project: { ...project, documents: {} }
    });
    show();
    expect(
        await screen.findByText("This project has no CSD or ORC files to play.")
    ).toBeTruthy();
});
