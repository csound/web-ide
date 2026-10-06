import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor
} from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import colors from "../../styles/_theme-github-light";
import ImpulseTool from "./impulse-tool";
import { encodeAudio } from "./audio";
import { runTool } from "./runner";

vi.mock("./runner", () => ({ runTool: vi.fn() }));
vi.mock("./visuals", () => ({ Waveform: () => <div>Waveform</div> }));
const samples = new Float32Array(8000);
samples[0] = 1;
const data = encodeAudio({ sampleRate: 8000, channels: [samples] });
beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    vi.stubGlobal(
        "URL",
        Object.assign(URL, {
            createObjectURL: vi.fn(() => "blob:test"),
            revokeObjectURL: vi.fn()
        })
    );
    vi.mocked(runTool).mockResolvedValue({ data, log: "" });
});
afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
});
function mount(mode: "impulse" | "convolution") {
    const save = vi.fn(() => "kept.wav");
    render(
        <ThemeProvider
            theme={createTheme({
                ...colors,
                font: { regular: "sans-serif", monospace: "monospace" }
            })}
        >
            <ImpulseTool
                mode={mode}
                sources={[
                    { id: "audio", name: "input.wav", load: async () => data }
                ]}
                onSave={save}
            />
        </ThemeProvider>
    );
    return save;
}
it("generates on demand, keeps one player, and uses the result as an extraction reference", async () => {
    const save = mount("impulse");
    expect(runTool).not.toHaveBeenCalled();
    await waitFor(() =>
        expect(
            screen
                .getByRole("button", { name: "Add to project" })
                .hasAttribute("disabled")
        ).toBe(false)
    );
    expect(runTool).toHaveBeenCalledWith(
        expect.objectContaining({
            tool: "mkir",
            args: ["-g", "-t1", "-r48000", "sweep.wav"]
        }),
        expect.any(AbortSignal),
        expect.any(Function)
    );
    expect(document.querySelectorAll("audio")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Add to project" }));
    expect(save).toHaveBeenCalledOnce();
    fireEvent.click(
        screen.getByRole("button", { name: "Use as reference sweep" })
    );
    fireEvent.change(screen.getByLabelText("Recording project file"), {
        target: { value: "audio" }
    });
    await waitFor(() =>
        expect(runTool).toHaveBeenCalledWith(
            expect.objectContaining({
                tool: "mkir",
                args: ["sweep.wav", "-irecording.wav", "-oimpulse.wav"]
            }),
            expect.any(AbortSignal),
            expect.any(Function)
        )
    );
    await waitFor(() =>
        expect(
            screen
                .getByRole("button", { name: "Add to project" })
                .hasAttribute("disabled")
        ).toBe(false)
    );
    expect(document.querySelectorAll("audio")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Clear all changes" }));
    expect(
        screen
            .getByRole("button", { name: "Download" })
            .hasAttribute("disabled")
    ).toBe(true);
});
it("converts automatically and clears back to the source without exporting stale data", async () => {
    mount("convolution");
    expect(runTool).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Impulse response project file"), {
        target: { value: "audio" }
    });
    await waitFor(() =>
        expect(
            screen
                .getByRole("button", { name: "Download" })
                .hasAttribute("disabled")
        ).toBe(false)
    );
    expect(runTool).toHaveBeenCalledWith(
        expect.objectContaining({
            tool: "cvanal",
            args: ["-X", "input.wav", "response.cv"]
        }),
        expect.any(AbortSignal),
        expect.any(Function)
    );
    fireEvent.change(screen.getByLabelText("Impulse start"), {
        target: { value: "0.1" }
    });
    expect(
        screen
            .getByRole("button", { name: "Download" })
            .hasAttribute("disabled")
    ).toBe(true);
    fireEvent.click(
        screen.getByRole("button", {
            name: "Reset convolution data to default"
        })
    );
    expect(screen.getByLabelText("Impulse start").getAttribute("value")).toBe(
        "0"
    );
    expect(
        screen
            .getByRole("button", { name: "Download" })
            .hasAttribute("disabled")
    ).toBe(true);
    expect(document.querySelectorAll("audio")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Apply" })).toBeNull();
});
