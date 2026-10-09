import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor
} from "@testing-library/react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import colors from "../../styles/_theme-github-light";
import { AudioFilePreview } from "./file-preview";
import { encodeAudio } from "../audio-tools/audio";
import { inspectMetadata } from "./inspect";
import { runTool } from "../audio-tools/runner";

vi.mock("../audio-tools/runner", () => ({ runTool: vi.fn() }));
vi.mock("./inspect", async (original) => ({
    ...(await original<typeof import("./inspect")>()),
    inspectMetadata: vi.fn()
}));
vi.mock("../audio-tools/visuals", () => ({
    Waveform: ({
        onSelect
    }: {
        onSelect: (range: [number, number]) => void;
    }) => <button onClick={() => onSelect([0.1, 0.6])}>Select range</button>
}));
const bytes = encodeAudio({
    sampleRate: 8000,
    channels: [new Float32Array(8000).fill(0.25)]
});
const theme = createTheme({
    ...colors,
    font: { regular: "sans-serif", monospace: "monospace" }
});
beforeEach(() => {
    vi.mocked(runTool).mockReset().mockResolvedValue({ data: bytes, log: "" });
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response(bytes))
    );
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:preview");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.mocked(inspectMetadata).mockResolvedValue({
        sampleRate: 8000,
        frames: 8000,
        channels: 1,
        bits: 32,
        duration: 1,
        instrument: [],
        broadcast: [],
        tags: []
    });
});
afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});
function mount() {
    const save = vi.fn(() => "tone-edited.wav");
    const rendered = render(
        <ThemeProvider theme={theme}>
            <AudioFilePreview
                url="blob:tone"
                filename="tone.wav"
                onSave={save}
            />
        </ThemeProvider>
    );
    return { save, ...rendered };
}
it("shows file properties and opens Resample with the current sample in this tab", async () => {
    const { save } = mount();
    await screen.findByRole("slider", { name: "Sample playback position" });
    expect(
        screen.getByRole("table", { name: "File details" }).textContent
    ).toContain("8,000 Hz");
    expect(
        screen.getByRole("table", { name: "Signal levels" }).textContent
    ).toContain("-12.04 dBFS");
    fireEvent.click(
        screen.getByRole("button", { name: "Resample", exact: true })
    );
    await screen.findByRole("button", { name: "File details" });
    await screen.findByRole("button", { name: "Add to project" });
    expect(
        screen.queryByRole("slider", { name: "Sample playback position" })
    ).toBeNull();
    expect(
        screen.getByRole("region", { name: "Changes" }).textContent
    ).toContain("No changes");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "File details" }));
    await screen.findByRole("table", { name: "File details" });
});
it("carries the selected range into Trim and saves only the trimmed result on request", async () => {
    const { save } = mount();
    await screen.findByRole("slider", { name: "Sample playback position" });
    fireEvent.click(screen.getByRole("button", { name: "Select range" }));
    fireEvent.click(screen.getByRole("button", { name: "Trim", exact: true }));
    await screen.findByText("tone-trim.wav");
    fireEvent.click(screen.getByRole("button", { name: "Add to project" }));
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0][0].data.length).toBe(58 + 4000 * 4);
});
it("uses the selected range as the noise profile and allows clearing the denoise edit", async () => {
    const { save } = mount();
    await screen.findByRole("slider", { name: "Sample playback position" });
    fireEvent.click(screen.getByRole("button", { name: "Select range" }));
    fireEvent.click(screen.getByRole("button", { name: "Reduce noise" }));
    await screen.findByText("tone-denoise.wav");
    expect(
        screen.getByLabelText<HTMLInputElement>("Selection start").value
    ).toBe("0.1");
    expect(screen.getByLabelText<HTMLInputElement>("Selection end").value).toBe(
        "0.6"
    );
    expect(
        screen.getByRole("region", { name: "Changes" }).textContent
    ).toContain("Noise from 0.1 s to 0.6 s");
    expect(runTool).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
            tool: "dnoise",
            args: expect.arrayContaining(["-b0.1", "-e0.6", "-m-20"])
        }),
        expect.any(AbortSignal),
        expect.any(Function)
    );
    expect(save).not.toHaveBeenCalled();
    fireEvent.click(
        screen.getByRole("button", { name: "Reset reduce noise to default" })
    );
    expect(
        screen.getByRole("region", { name: "Changes" }).textContent
    ).toContain("No changes");
    expect(screen.queryByText("tone-denoise.wav")).toBeNull();
    expect(runTool).toHaveBeenCalledOnce();
});
it.each([24000, 48000])(
    "shows the %i Hz source rate without running a resampler on open",
    async (rate) => {
        const source = encodeAudio({
            sampleRate: rate,
            channels: [new Float32Array(rate).fill(0.25)]
        });
        vi.mocked(fetch).mockResolvedValueOnce(new Response(source));
        mount();
        await screen.findByRole("slider", { name: "Sample playback position" });
        fireEvent.click(
            screen.getByRole("button", { name: "Resample", exact: true })
        );
        const select = await screen.findByRole<HTMLSelectElement>("combobox", {
            name: "Sample rate"
        });
        expect(select.value).toBe(String(rate));
        expect(select.selectedOptions[0].textContent).toBe(
            `${rate.toLocaleString()} Hz`
        );
        expect(
            [...select.options].filter(
                (option) => option.value === String(rate)
            )
        ).toHaveLength(1);
        expect(
            screen.getByRole("region", { name: "Changes" }).textContent
        ).toContain("No changes");
        expect(runTool).not.toHaveBeenCalled();
        fireEvent.change(select, { target: { value: "44100" } });
        await screen.findByText("tone-resample.wav");
        expect(runTool).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({
                tool: "src_conv",
                args: expect.arrayContaining(["-r44100"])
            }),
            expect.any(AbortSignal),
            expect.any(Function)
        );
        fireEvent.change(select, { target: { value: String(rate) } });
        await waitFor(() => expect(runTool).toHaveBeenCalledTimes(2));
        expect(runTool).toHaveBeenLastCalledWith(
            expect.objectContaining({
                tool: "src_conv",
                args: expect.arrayContaining([`-r${rate}`])
            }),
            expect.any(AbortSignal),
            expect.any(Function)
        );
    }
);
it("keeps playback available on inspection failure and aborts file work on close", async () => {
    vi.mocked(inspectMetadata).mockRejectedValue(new Error("Unknown format"));
    vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response(new Uint8Array([1, 2])))
    );
    const { unmount } = mount();
    await screen.findByText("Some file metadata could not be read.");
    await waitFor(() =>
        expect(
            screen.getByLabelText("Sample audio").hasAttribute("controls")
        ).toBe(true)
    );
    expect(
        screen
            .getByRole("button", { name: "Resample" })
            .hasAttribute("disabled")
    ).toBe(true);
    const signal = vi.mocked(fetch).mock.calls[0][1]?.signal;
    unmount();
    expect(signal?.aborted).toBe(true);
});
