import { afterEach, expect, it, vi } from "vitest";
import { isCsoundBusy, runPerformance } from "../csound/actions";
import { loadManualExampleAssets } from "./manual-examples";
import {
    playTemporaryDocument,
    retainTemporaryPlayback,
    stopTemporaryDocument,
    temporaryPlaybackUid
} from "./temporary-playback";

vi.mock("../csound/actions", () => ({
    isCsoundBusy: vi.fn(() => false),
    runPerformance: vi.fn()
}));
vi.mock("./manual-examples", () => ({
    loadManualExampleAssets: vi.fn(async () => [])
}));

afterEach(() => {
    const options = vi.mocked(runPerformance).mock.calls.at(-1)?.[0];
    options?.onEnded?.();
    vi.clearAllMocks();
});

it("plays the edited buffer without saving and stops only when its last tab closes", async () => {
    vi.mocked(runPerformance).mockResolvedValue({
        status: "playing",
        files: []
    });
    await playTemporaryDocument(
        "project",
        "example",
        { filename: "a.csd", value: "edited CSD" },
        vi.fn()
    );
    const options = vi.mocked(runPerformance).mock.calls[0][0];
    expect(options).toMatchObject({
        csdText: "edited CSD",
        collectFiles: false,
        mode: "play"
    });
    expect(temporaryPlaybackUid()).toBe("example");
    retainTemporaryPlayback("project", ["example"]);
    retainTemporaryPlayback("another-project", []);
    expect(options.signal?.aborted).toBe(false);
    retainTemporaryPlayback("project", []);
    expect(options.signal?.aborted).toBe(true);
    options.onEnded?.();
    expect(temporaryPlaybackUid()).toBeUndefined();
});

it("cancels sample loading when the tab closes before Csound starts", async () => {
    vi.mocked(loadManualExampleAssets).mockImplementationOnce(
        (_document, signal) =>
            new Promise((_resolve, reject) => {
                signal.addEventListener("abort", () => reject(signal.reason), {
                    once: true
                });
            })
    );
    const playing = playTemporaryDocument(
        "project",
        "loading-example",
        { filename: "a.csd", value: "source" },
        vi.fn()
    );
    stopTemporaryDocument("loading-example");
    await playing;
    expect(runPerformance).not.toHaveBeenCalled();
    expect(temporaryPlaybackUid()).toBeUndefined();
});

it("preserves an existing project performance", async () => {
    vi.mocked(isCsoundBusy).mockReturnValueOnce(true);
    await expect(
        playTemporaryDocument(
            "project",
            "example",
            { filename: "a.csd", value: "source" },
            vi.fn()
        )
    ).rejects.toThrow("Stop playback");
    expect(loadManualExampleAssets).not.toHaveBeenCalled();
    expect(runPerformance).not.toHaveBeenCalled();
});
