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
    await screen.findByRole("button", { name: "Apply" });
}
it("loads audio without starting WASM, then keeps the result only on request", async () => {
    const save = mount();
    await load();
    expect(runTool).not.toHaveBeenCalled();
    vi.mocked(runTool).mockResolvedValue({ data, log: "" });
    fireEvent.change(screen.getByLabelText("Selection start"), {
        target: { value: "0.25" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await screen.findByRole("button", { name: "Add sample to project" });
    expect(runTool).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
    fireEvent.click(
        screen.getByRole("button", { name: "Add sample to project" })
    );
    expect(save).toHaveBeenCalledOnce();
    expect(durationOf(decodeWave(save.mock.calls[0][0].data))).toBe(0.75);
    expect(
        screen
            .getByRole("button", { name: "Add sample to project" })
            .hasAttribute("disabled")
    ).toBe(true);
});
it("cancels a job and allows another operation", async () => {
    mount();
    await load();
    fireEvent.click(screen.getByRole("button", { name: "Gain", exact: true }));
    let signal: AbortSignal | undefined;
    vi.mocked(runTool).mockImplementation((_, current) => {
        signal = current;
        return new Promise((_, reject) =>
            current.addEventListener("abort", () =>
                reject(new DOMException("Cancelled", "AbortError"))
            )
        );
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(signal?.aborted).toBe(true);
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Gain", exact: true }));
    expect(screen.getByRole("slider", { name: "Gain" })).toBeTruthy();
});
it("shows processing errors and can retry", async () => {
    mount();
    await load();
    fireEvent.click(screen.getByRole("button", { name: "Gain", exact: true }));
    vi.mocked(runTool).mockRejectedValueOnce(
        new Error("Could not load the audio tool. Try again.")
    );
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
        "Try again"
    );
    vi.mocked(runTool).mockResolvedValueOnce({ data, log: "" });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await screen.findByRole("button", { name: "Add sample to project" });
    expect(screen.queryByRole("alert")).toBeNull();
});
it("offers analysis modes without loading WASM on open", async () => {
    mount("analysis");
    expect(screen.getByText("See what is in your sound")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Project audio file"), {
        target: { value: "test" }
    });
    await screen.findByRole("button", { name: "Analyze" });
    for (const name of [
        "Spectrum",
        "Partials",
        "Harmonics",
        "Voice",
        "Envelope"
    ])
        expect(screen.getByRole("button", { name, exact: true })).toBeTruthy();
    expect(runTool).not.toHaveBeenCalled();
});

it("cancels trim preparation without publishing a result, then allows retry", async () => {
    mount();
    await load();
    fireEvent.click(screen.getByRole("button", { name: "Trim", exact: true }));
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await act(() => vi.runAllTimersAsync());
    expect(
        screen.queryByRole("button", { name: "Add sample to project" })
    ).toBeNull();
    expect(runTool).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await act(() => vi.runAllTimersAsync());
    expect(
        screen.getByRole("button", { name: "Add sample to project" })
    ).toBeTruthy();
});

it("cancels result decoding without publishing a late worker result", async () => {
    mount();
    await load();
    vi.useFakeTimers();
    vi.mocked(runTool).mockResolvedValue({ data, log: "" });
    fireEvent.click(screen.getByRole("button", { name: "Gain", exact: true }));
    await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    });
    expect(runTool).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await act(() => vi.runAllTimersAsync());
    expect(
        screen.queryByRole("button", { name: "Add sample to project" })
    ).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
});

it("keeps applied settings stable while pending edits change, and lets users discard the result", async () => {
    mount();
    await load();
    expect(
        screen.getByRole("button", { name: "Apply" }).hasAttribute("disabled")
    ).toBe(true);
    fireEvent.change(screen.getByLabelText("Selection start"), {
        target: { value: "0.25" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await screen.findByRole("button", { name: "Add sample to project" });
    expect(
        screen.getByRole("button", { name: "Apply" }).hasAttribute("disabled")
    ).toBe(true);
    expect(screen.queryByRole("group", { name: "Compare audio" })).toBeNull();
    fireEvent.change(screen.getByLabelText("Selection start"), {
        target: { value: "0.5" }
    });
    expect(
        within(screen.getByRole("region", { name: "Pending edits" })).getByText(
            "Keep 0.5 s to 1 s"
        )
    ).toBeTruthy();
    expect(
        within(screen.getByRole("region", { name: "Applied edits" })).getByText(
            "Keep 0.25 s to 1 s"
        )
    ).toBeTruthy();
    expect(screen.getByLabelText("Result playback time").textContent).toContain(
        "0.75"
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove trim" }));
    expect(
        screen.getByRole("button", { name: "Apply" }).hasAttribute("disabled")
    ).toBe(true);
    expect(screen.getByRole("region", { name: "Applied edits" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Discard result" }));
    expect(screen.queryByRole("region", { name: "Applied edits" })).toBeNull();
    expect(screen.queryByLabelText("Result audio")).toBeNull();
    expect(screen.getByLabelText("Original audio")).toBeTruthy();
});
