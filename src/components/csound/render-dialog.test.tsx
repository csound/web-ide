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
import { runPerformance } from "./actions";
import { prepareCompletionBell } from "./completion-bell";

vi.mock("./actions", async (importOriginal) => ({
    ...(await importOriginal<typeof import("./actions")>()),
    runPerformance: vi.fn()
}));
vi.mock("./completion-bell", () => ({ prepareCompletionBell: vi.fn() }));
const ring = vi.fn();
const close = vi.fn();
const source =
    "<CsoundSynthesizer>\n<CsOptions>-odac</CsOptions>\n<CsInstruments>\nsr=48000\nksmps=32\n</CsInstruments></CsoundSynthesizer>";
beforeEach(() => {
    vi.mocked(prepareCompletionBell).mockReturnValue({ ring, close });
    vi.mocked(runPerformance).mockResolvedValue({
        status: "completed",
        files: ["piece.wav"]
    });
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
        expect(runPerformance).toHaveBeenCalledWith(
            expect.objectContaining({
                mode: "render",
                renderSettings: {
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
        fireEvent.click(screen.getByRole("checkbox"));
        fireEvent.click(screen.getByRole("button", { name: "Render audio" }));
        await screen.findByText("Render complete");
        expect(ring).toHaveBeenCalledOnce();
        expect(runPerformance).toHaveBeenCalledWith(
            expect.objectContaining({
                renderSettings: expect.objectContaining({
                    sampleRate: 44100,
                    ksmps: 1
                })
            })
        );
    });
    it("shows errors without ringing and lets the user try again", async () => {
        vi.mocked(runPerformance).mockRejectedValueOnce(
            new Error("Csound compilation failed")
        );
        fireEvent.click(screen.getByRole("checkbox"));
        fireEvent.click(screen.getByRole("button", { name: "Render audio" }));
        await screen.findByText("Csound compilation failed");
        expect(ring).not.toHaveBeenCalled();
        expect(close).toHaveBeenCalledOnce();
        expect(
            screen.getByRole("button", { name: "Render audio" })
        ).toBeTruthy();
    });
    it("cancels through the run signal without ringing", async () => {
        vi.mocked(runPerformance).mockImplementationOnce(
            ({ signal }) =>
                new Promise((_resolve, reject) =>
                    signal!.addEventListener("abort", () =>
                        reject(signal!.reason)
                    )
                )
        );
        fireEvent.click(screen.getByRole("checkbox"));
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
        expect(runPerformance).not.toHaveBeenCalled();
    });
});
