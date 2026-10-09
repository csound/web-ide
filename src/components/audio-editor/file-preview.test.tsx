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
