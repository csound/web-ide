import { afterEach, expect, it, vi } from "vitest";
import { decodeWave, encodeAudio, encodeAudioAsync } from "./audio";
import { rawToWave } from "../csound/wave-files";
import { defaultSettings, makeRequest } from "./operations";

afterEach(() => vi.useRealTimers());

it("rejects resampling that would exceed the decoded sample limit before running WASM", () => {
    const input = rawToWave(new Uint8Array(1_360_000), 8000, 1, "8", 1);
    expect(() =>
        makeRequest(
            "resample",
            { ...defaultSettings, rate: 96000 },
            input,
            [0, 170],
            170
        )
    ).toThrow("too large");
});

it("writes the same float WAV header and interleaved samples in one buffer", async () => {
    const audio = {
        sampleRate: 8000,
        channels: [
            new Float32Array([0.1, 0.2, 0.3]),
            new Float32Array([-0.1, -0.2, -0.3])
        ]
    };
    const samples = new Uint8Array(16);
    const view = new DataView(samples.buffer);
    [0.2, -0.2, 0.3, -0.3].forEach((value, index) =>
        view.setFloat32(index * 4, value, true)
    );
    const result = await encodeAudioAsync(audio, new AbortController().signal, [
        1 / 8000,
        3 / 8000
    ]);
    expect(result).toEqual(rawToWave(samples, 8000, 2, "float", 1));
    expect(result.buffer.byteLength).toBe(result.length);
    expect(audio.channels[0]).toEqual(new Float32Array([0.1, 0.2, 0.3]));
});

it("extracts the requested analysis channel without changing its samples", async () => {
    const audio = {
        sampleRate: 8000,
        channels: [new Float32Array(100), new Float32Array(100).fill(0.2)]
    };
    const bytes = await encodeAudioAsync(
        audio,
        new AbortController().signal,
        [0, 100 / 8000],
        1
    );
    expect(decodeWave(bytes).channels).toEqual([audio.channels[1]]);
});

it("lets cancellation interrupt encoding after a block, without returning partial output", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const result = encodeAudioAsync(
        { sampleRate: 8000, channels: [new Float32Array(262144)] },
        controller.signal
    );
    const rejected = expect(result).rejects.toMatchObject({
        name: "AbortError"
    });
    await vi.advanceTimersToNextTimerAsync();
    controller.abort();
    await vi.runAllTimersAsync();
    await rejected;
});

it("rejects cancelled encoding before allocating output", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
        encodeAudioAsync(
            { sampleRate: 8000, channels: [new Float32Array(1)] },
            controller.signal
        )
    ).rejects.toMatchObject({ name: "AbortError" });
});

it("rejects mismatched channel lengths instead of writing NaN samples", () => {
    expect(() =>
        encodeAudio({
            sampleRate: 8000,
            channels: [new Float32Array(2), new Float32Array(1)]
        })
    ).toThrow("Invalid audio layout");
});
