import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor
} from "@testing-library/react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import colors from "../../styles/_theme-github-light";
import MixerTool from "./mixer-tool";
import { buildMix, prepareMixAudio } from "./mixer";
import { encodeAudio } from "./audio";

vi.mock("./mixer", async (original) => ({
    ...(await original<typeof import("./mixer")>()),
    buildMix: vi.fn(),
    prepareMixAudio: vi.fn()
}));
vi.mock("./mix-timeline", () => ({ MixTimeline: () => <div>Clip</div> }));
vi.mock("./visuals", () => ({ Waveform: () => <div>Waveform</div> }));
const audio = {
    sampleRate: 8000,
    channels: [new Float32Array(80), new Float32Array(80)]
};
const result = { name: "mix.wav", audio, data: encodeAudio(audio), peak: 0 };
beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    vi.stubGlobal(
        "URL",
        Object.assign(URL, {
            createObjectURL: vi.fn(() => "blob:mix"),
            revokeObjectURL: vi.fn()
        })
    );
    vi.mocked(prepareMixAudio).mockResolvedValue(result);
    vi.mocked(buildMix).mockResolvedValue(result);
});
afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    vi.useRealTimers();
});
function mount() {
    const save = vi.fn(() => "mix.wav");
    const view = render(
        <ThemeProvider
            theme={createTheme({
                ...colors,
                font: { regular: "sans-serif", monospace: "monospace" }
            })}
        >
            <MixerTool
                sources={[
                    {
                        id: "tone",
                        name: "tone.wav",
                        load: async () => result.data
                    }
                ]}
                onSave={save}
            />
        </ThemeProvider>
    );
    return { ...view, save };
}
async function add() {
    fireEvent.change(screen.getByLabelText("Project audio file"), {
        target: { value: "tone" }
    });
    await screen.findByLabelText("Track 1 start");
    await waitFor(() =>
        expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull()
    );
}
it("never loads the binary on open and aborts an obsolete render before saving", async () => {
    const { save, unmount } = mount();
    expect(buildMix).not.toHaveBeenCalled();
    await add();
    await screen.findByLabelText("Mix audio");
    vi.useFakeTimers();
    let finish: (value: typeof result) => void;
    vi.mocked(buildMix).mockImplementationOnce(
        () =>
            new Promise((resolve) => {
                finish = resolve;
            })
    );
    fireEvent.change(screen.getByLabelText("Track 1 start"), {
        target: { value: "1" }
    });
    expect(
        screen
            .getByRole("button", { name: "Play mix" })
            .hasAttribute("disabled")
    ).toBe(true);
    expect(
        screen
            .getByRole("button", { name: "Add to project" })
            .hasAttribute("disabled")
    ).toBe(true);
    await act(async () => {
        await vi.advanceTimersByTimeAsync(400);
    });
    const oldSignal = vi.mocked(buildMix).mock.calls.at(-1)![1];
    fireEvent.change(screen.getByLabelText("Track 1 start"), {
        target: { value: "2" }
    });
    expect(oldSignal.aborted).toBe(true);
    await act(async () => {
        finish!({ ...result, name: "outdated.wav" });
        await vi.advanceTimersByTimeAsync(400);
    });
    fireEvent.click(screen.getByRole("button", { name: "Add to project" }));
    expect(save).toHaveBeenCalledWith(result);
    expect(save).toHaveBeenCalledOnce();
    expect(document.querySelectorAll("audio")).toHaveLength(1);
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
});
it("cancels an import without appending its late result", async () => {
    mount();
    let finish: (value: typeof result) => void;
    vi.mocked(prepareMixAudio).mockImplementationOnce(
        () =>
            new Promise((resolve) => {
                finish = resolve;
            })
    );
    fireEvent.change(screen.getByLabelText("Project audio file"), {
        target: { value: "tone" }
    });
    await waitFor(() => expect(prepareMixAudio).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await act(async () => {
        finish!(result);
    });
    expect(screen.queryByLabelText("Track 1 start")).toBeNull();
    expect(buildMix).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).toBeNull();
});
it("aborts active processing when the window closes", async () => {
    const { unmount } = mount();
    vi.mocked(buildMix).mockImplementationOnce(() => new Promise(() => {}));
    await add();
    await waitFor(() => expect(buildMix).toHaveBeenCalledOnce());
    const signal = vi.mocked(buildMix).mock.calls[0][1];
    unmount();
    expect(signal.aborted).toBe(true);
});
