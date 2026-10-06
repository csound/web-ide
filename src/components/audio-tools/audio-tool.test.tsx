import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
    cleanup,
    act,
    fireEvent,
    render,
    screen,
    waitFor
} from "@testing-library/react";
import { within } from "@testing-library/react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import theme from "../../styles/_theme-github-light";
import AudioTool from "./audio-tool";
import { decodeWave, durationOf, encodeAudio } from "./audio";
import { runTool } from "./runner";

vi.mock("./runner", () => ({ runTool: vi.fn() }));
vi.mock("./visuals", () => ({
    Waveform: () => <div>Waveform</div>,
    AnalysisGraph: () => <div>Analysis graph</div>
}));
const data = encodeAudio({
    sampleRate: 8000,
    channels: [new Float32Array(8000).fill(0.2)]
});
beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    vi.stubGlobal(
        "URL",
        Object.assign(URL, {
            createObjectURL: vi.fn(() => "blob:audio-test"),
            revokeObjectURL: vi.fn()
        })
    );
});
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
});
/** Render a themed tool with a local audio source and observable result retention. */
function mount(mode: "sample" | "analysis" = "sample") {
    const save = vi.fn((_file: { data: Uint8Array }) => "kept.wav");
    render(
        <ThemeProvider
            theme={createTheme({
                ...theme,
                font: { regular: "sans-serif", monospace: "monospace" }
            })}
        >
            <AudioTool
                mode={mode}
                sources={[
                    { id: "test", name: "tone.wav", load: async () => data }
                ]}
                onSave={save}
            />
        </ThemeProvider>
    );
    return save;
}
/** Choose the test source and wait until the editing controls are ready. */
async function load() {
    fireEvent.change(screen.getByLabelText("Project audio file"), {
        target: { value: "test" }
    });
    await screen.findByRole("button", { name: "Add to project" });
}

it("automatically trims, plays one preview, and saves only on request", async () => {
    const save = mount();
    await load();
    expect(screen.queryByRole("button", { name: "Apply" })).toBeNull();
    expect(runTool).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Selection start"), {
        target: { value: "0.25" }
    });
    expect(
        screen
            .getByRole("button", { name: "Add to project" })
            .hasAttribute("disabled")
    ).toBe(true);
    await screen.findByText("tone-trim.wav");
    expect(document.querySelectorAll("audio")).toHaveLength(1);
    expect(
        screen.getByLabelText("Preview playback time").textContent
    ).toContain("0.75");
    expect(save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Add to project" }));
    expect(durationOf(decodeWave(save.mock.calls[0][0].data))).toBe(0.75);
    expect(
        screen
            .getByRole("button", { name: "Add to project" })
            .hasAttribute("disabled")
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Clear all changes" }));
    expect(
        screen.getByLabelText("Preview playback time").textContent
    ).toContain("1.00");
    expect(
        screen.getByRole("region", { name: "Changes" }).textContent
    ).toContain("No changes");
    expect(
        screen
            .getByRole("button", { name: "Download" })
            .hasAttribute("disabled")
    ).toBe(false);
});

it("debounces changes and clearing cancels preparation without publishing a late result", async () => {
    mount();
    await load();
    vi.useFakeTimers();
    let resolve: (value: { data: Uint8Array; log: string }) => void = () => {};
    let signal: AbortSignal | undefined;
    vi.mocked(runTool).mockImplementation((_, current) => {
        signal = current;
        return new Promise((done) => {
            resolve = done;
        });
    });
    fireEvent.click(screen.getByRole("button", { name: "Gain", exact: true }));
    fireEvent.change(screen.getByRole("slider", { name: "Gain" }), {
        target: { value: "-6" }
    });
    await act(() => vi.advanceTimersByTimeAsync(399));
    expect(runTool).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("slider", { name: "Gain" }), {
        target: { value: "-12" }
    });
    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(runTool).toHaveBeenCalledOnce();
    expect(runTool).toHaveBeenCalledWith(
        expect.objectContaining({
            args: expect.arrayContaining([`-F${10 ** (-12 / 20)}`])
        }),
        expect.any(AbortSignal),
        expect.any(Function)
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear all changes" }));
    expect(signal?.aborted).toBe(true);
    await act(async () => {
        resolve({ data, log: "" });
        await vi.runAllTimersAsync();
    });
    expect(screen.queryByText("tone-gain.wav")).toBeNull();
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(
        screen.getByLabelText("Preview playback time").textContent
    ).toContain("1.00");
});

it("removes an effect and restores the loaded file without another worker", async () => {
    mount();
    await load();
    vi.mocked(runTool).mockResolvedValue({ data, log: "" });
    fireEvent.click(screen.getByRole("button", { name: "Gain", exact: true }));
    await screen.findByText("tone-gain.wav");
    fireEvent.click(screen.getByRole("button", { name: "Remove gain" }));
    expect(screen.queryByText("tone-gain.wav")).toBeNull();
    expect(runTool).toHaveBeenCalledOnce();
    expect(
        screen.getByRole("slider", { name: "Gain" }).getAttribute("value")
    ).toBe("0");
});

it("shows errors, blocks stale exports, and retries on request", async () => {
    mount();
    await load();
    vi.mocked(runTool).mockRejectedValueOnce(
        new Error("Could not load the audio tool. Try again.")
    );
    fireEvent.click(screen.getByRole("button", { name: "Gain", exact: true }));
    expect((await screen.findByRole("alert")).textContent).toContain(
        "Try again"
    );
    expect(
        screen
            .getByRole("button", { name: "Download" })
            .hasAttribute("disabled")
    ).toBe(true);
    vi.mocked(runTool).mockResolvedValueOnce({ data, log: "" });
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await screen.findByText("tone-gain.wav");
    expect(screen.queryByRole("alert")).toBeNull();
});

it("automatically starts analysis after loading and clear cancels it", async () => {
    mount("analysis");
    vi.mocked(runTool).mockImplementation(() => new Promise(() => {}));
    await load();
    expect(screen.queryByRole("button", { name: "Analyze" })).toBeNull();
    await waitFor(() => expect(runTool).toHaveBeenCalledOnce());
    expect(
        within(screen.getByRole("region", { name: "Changes" })).getByText(
            "Spectrum"
        )
    ).toBeTruthy();
    const signal = vi.mocked(runTool).mock.calls[0][1];
    fireEvent.click(screen.getByRole("button", { name: "Clear all changes" }));
    expect(signal.aborted).toBe(true);
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(
        screen
            .getByRole("button", { name: "Download" })
            .hasAttribute("disabled")
    ).toBe(false);
    expect(document.querySelectorAll("audio")).toHaveLength(1);
});
