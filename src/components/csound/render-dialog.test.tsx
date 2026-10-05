import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor
} from "@testing-library/react";
import { Provider } from "react-redux";
import { store } from "../../store";
import ThemeProvider from "../../styles/theme-provider";
import { RenderDialog } from "./render-dialog";
import { renderJob } from "./render-job";
import { prepareCompletionBell } from "./completion-bell";
import { updateAllTargetsLocally } from "../target-controls/actions";

vi.mock("./render-job", () => ({ renderJob: vi.fn() }));
vi.mock("./completion-bell", () => ({ prepareCompletionBell: vi.fn() }));
const ring = vi.fn();
const close = vi.fn();
const source =
    "<CsoundSynthesizer>\n<CsOptions>-odac</CsOptions>\n<CsInstruments>\nsr=48000\nksmps=32\n</CsInstruments></CsoundSynthesizer>";
beforeEach(() => {
    vi.mocked(prepareCompletionBell).mockReturnValue({ ring, close });
    vi.mocked(renderJob).mockResolvedValue(["piece.wav"]);
    store.dispatch({
        type: "PROJECTS.STORE_PROJECT_LOCALLY",
        projects: [
            {
                projectUid: "render-ui",
                documents: {
                    csd: {
                        documentUid: "csd",
                        filename: "piece.csd",
                        type: "txt",
                        currentValue: source,
                        path: []
                    }
                }
            }
        ]
    });
    render(
        <Provider store={store}>
            <ThemeProvider>
                <RenderDialog
                    projectUid="render-ui"
                    documentUid="csd"
                    setConsole={vi.fn()}
                />
            </ThemeProvider>
        </Provider>
    );
});
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("render dialog", () => {
    it("switches float WAV to valid FLAC settings and submits sample-accurate timing", async () => {
        fireEvent.change(screen.getByLabelText("Bit depth", { exact: true }), {
            target: { value: "float" }
        });
        fireEvent.change(screen.getByLabelText("Format", { exact: true }), {
            target: { value: "flac" }
        });
        expect(
            (
                screen.getByLabelText("Bit depth", {
                    exact: true
                }) as HTMLSelectElement
            ).value
        ).toBe("24");
        expect(
            screen.queryByRole("option", { name: "32-bit float" })
        ).toBeNull();
        expect(
            screen.queryByLabelText("Encoding quality", { exact: true })
        ).toBeNull();
        fireEvent.change(screen.getByLabelText("Bit depth", { exact: true }), {
            target: { value: "16" }
        });
        expect(
            (
                screen.getByLabelText("Dither", {
                    exact: true
                }) as HTMLSelectElement
            ).disabled
        ).toBe(false);
        fireEvent.click(
            screen.getByRole("checkbox", {
                name: "Sample-accurate score timing"
            })
        );
        fireEvent.click(screen.getByRole("button", { name: "Render audio" }));
        await screen.findByText("Render complete");
        expect(renderJob).toHaveBeenCalledWith(
            expect.objectContaining({
                settings: expect.objectContaining({
                    format: "flac",
                    bitDepth: "16",
                    sampleAccurate: true
                })
            })
        );
    });
    it("uses project values by default and offers the right format controls", async () => {
        expect(screen.getByPlaceholderText("Project: 48000")).toBeTruthy();
        fireEvent.change(screen.getByLabelText("Format", { exact: true }), {
            target: { value: "mp3" }
        });
        expect(
            screen.queryByLabelText("Bit depth", { exact: true })
        ).toBeNull();
        expect(
            screen.getByLabelText("Encoding quality", { exact: true })
        ).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Render audio" }));
        await screen.findByText("Render complete");
        expect(renderJob).toHaveBeenCalledWith(
            expect.objectContaining({
                settings: {
                    filename: "piece",
                    format: "mp3",
                    bitDepth: "24",
                    quality: 0.6
                }
            })
        );
        expect(prepareCompletionBell).not.toHaveBeenCalled();
    });
    it("rings only after a successful render and passes overrides", async () => {
        fireEvent.change(
            screen.getByLabelText("Sample rate (sr)", { exact: true }),
            { target: { value: "44100" } }
        );
        fireEvent.change(
            screen.getByLabelText("Control block (ksmps)", { exact: true }),
            { target: { value: "1" } }
        );
        fireEvent.click(
            screen.getByRole("checkbox", {
                name: "Play a bell when rendering finishes"
            })
        );
        fireEvent.click(screen.getByRole("button", { name: "Render audio" }));
        await screen.findByText("Render complete");
        expect(ring).toHaveBeenCalledOnce();
        expect(renderJob).toHaveBeenCalledWith(
            expect.objectContaining({
                settings: expect.objectContaining({
                    sampleRate: 44100,
                    ksmps: 1
                })
            })
        );
    });
    it("shows errors without ringing and lets the user try again", async () => {
        vi.mocked(renderJob).mockRejectedValueOnce(
            new Error("Csound compilation failed")
        );
        fireEvent.click(
            screen.getByRole("checkbox", {
                name: "Play a bell when rendering finishes"
            })
        );
        fireEvent.click(screen.getByRole("button", { name: "Render audio" }));
        await screen.findByText("Csound compilation failed");
        expect(ring).not.toHaveBeenCalled();
        expect(close).toHaveBeenCalledOnce();
        expect(
            screen.getByRole("button", { name: "Render audio" })
        ).toBeTruthy();
    });
    it("keeps completed files available when the bell fails", async () => {
        ring.mockImplementationOnce(() => {
            throw new Error("Audio context failed");
        });
        fireEvent.click(
            screen.getByRole("checkbox", {
                name: "Play a bell when rendering finishes"
            })
        );
        fireEvent.click(screen.getByRole("button", { name: "Render audio" }));
        await screen.findByText("Render complete");
        expect(
            screen.getByRole("button", { name: "Download audio" })
        ).toBeTruthy();
        expect(screen.queryByRole("alert")).toBeNull();
        expect(
            screen.queryByRole("button", { name: "Render audio" })
        ).toBeNull();
        expect(renderJob).toHaveBeenCalledOnce();
        expect(close).toHaveBeenCalledOnce();
    });
    it("cancels through the run signal without ringing", async () => {
        vi.mocked(renderJob).mockImplementationOnce(
            ({ signal }) =>
                new Promise((_resolve, reject) =>
                    signal!.addEventListener("abort", () =>
                        reject(signal!.reason)
                    )
                )
        );
        fireEvent.click(
            screen.getByRole("checkbox", {
                name: "Play a bell when rendering finishes"
            })
        );
        fireEvent.click(screen.getByRole("button", { name: "Render audio" }));
        fireEvent.click(
            await screen.findByRole("button", { name: "Cancel render" })
        );
        await screen.findByText("Render cancelled. No partial file was added.");
        expect(ring).not.toHaveBeenCalled();
        expect(close).toHaveBeenCalledOnce();
    });
    it("explains ksmps on click and rejects path names", async () => {
        fireEvent.click(
            screen.getByRole("button", { name: "About Control block (ksmps)" })
        );
        await waitFor(() =>
            expect(screen.getByRole("tooltip").textContent).toContain(
                "much more slowly"
            )
        );
        fireEvent.change(screen.getByLabelText("Filename", { exact: true }), {
            target: { value: "../test" }
        });
        fireEvent.click(screen.getByRole("button", { name: "Render audio" }));
        expect(await screen.findByRole("alert")).toBeTruthy();
        expect(renderJob).not.toHaveBeenCalled();
    });
    it("allows multichannel MP3 only when splitting to mono files", async () => {
        fireEvent.change(screen.getByLabelText("Format", { exact: true }), {
            target: { value: "mp3" }
        });
        fireEvent.change(
            screen.getByLabelText("Output channels", { exact: true }),
            { target: { value: "4" } }
        );
        fireEvent.click(screen.getByRole("button", { name: "Render audio" }));
        expect(await screen.findByRole("alert")).toBeTruthy();
        expect(renderJob).not.toHaveBeenCalled();
        fireEvent.click(
            screen.getByRole("checkbox", {
                name: "Separate mono file for each channel"
            })
        );
        fireEvent.click(screen.getByRole("button", { name: "Render audio" }));
        await screen.findByText("Render complete");
        expect(renderJob).toHaveBeenCalledWith(
            expect.objectContaining({
                splitChannels: true,
                settings: expect.objectContaining({
                    format: "mp3",
                    channels: 4
                })
            })
        );
    });
    it("selects playlist tracks and prevents exporting an empty selection", async () => {
        cleanup();
        updateAllTargetsLocally(store.dispatch, "Playlist", "render-ui", {
            Playlist: {
                targetName: "Playlist",
                targetType: "playlist",
                playlistDocumentsUid: ["csd"],
                csoundOptions: {}
            }
        });
        render(
            <Provider store={store}>
                <ThemeProvider>
                    <RenderDialog
                        projectUid="render-ui"
                        documentUid="csd"
                        setConsole={vi.fn()}
                    />
                </ThemeProvider>
            </Provider>
        );
        const track = screen.getByRole("checkbox", { name: "1. piece.csd" });
        fireEvent.click(track);
        expect(
            (
                screen.getByRole("button", {
                    name: "Render audio"
                }) as HTMLButtonElement
            ).disabled
        ).toBe(true);
        fireEvent.click(track);
        fireEvent.change(
            screen.getByLabelText("Track files", { exact: true }),
            { target: { value: "combined" } }
        );
        fireEvent.click(screen.getByRole("button", { name: "Render audio" }));
        await screen.findByText("Render complete");
        expect(renderJob).toHaveBeenCalledWith(
            expect.objectContaining({
                combine: true,
                documents: [expect.objectContaining({ documentUid: "csd" })]
            })
        );
    });
});
