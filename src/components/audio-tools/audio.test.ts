import { afterEach, expect, it, vi } from "vitest";
import {
    decodeWave,
    decodeWaveWithPeak,
    encodeAudio,
    encodeAudioAsync,
    encodeSilenceAsync
} from "./audio";
import { rawToWave, readWave } from "../csound/wave-files";
import { MAX_AUDIO_SAMPLES } from "./limits";
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

it("writes a silent WAV with the exact frame count, channel layout and zero samples", async () => {
    const frames = 65537;
    const bytes = await encodeSilenceAsync(
        48000,
        frames,
        2,
        new AbortController().signal
    );
    expect(bytes).toEqual(
        rawToWave(new Uint8Array(frames * 8), 48000, 2, "float", 1)
    );
    expect(readWave(bytes)).toMatchObject({
        frames,
        channels: 2,
        sampleRate: 48000,
        bits: 32,
        format: 3
    });
    expect(decodeWave(bytes).channels).toEqual([
        new Float32Array(frames),
        new Float32Array(frames)
    ]);
});

it("rejects silence beyond the decoded sample limit", async () => {
    await expect(
        encodeSilenceAsync(
            48000,
            MAX_AUDIO_SAMPLES / 2 + 1,
            2,
            new AbortController().signal
        )
    ).rejects.toThrow("too large");
});

it.each([true, false])(
    "cancels silent WAV allocation with an initially aborted signal: %s",
    async (aborted) => {
        vi.useFakeTimers();
        const controller = new AbortController();
        if (aborted) controller.abort();
        const result = encodeSilenceAsync(
            48000,
            MAX_AUDIO_SAMPLES / 2,
            2,
            controller.signal
        );
        const rejected = expect(result).rejects.toMatchObject({
            name: "AbortError"
        });
        controller.abort();
        await vi.runAllTimersAsync();
        await rejected;
    }
);

it("measures decoded peaks across channels without counting invalid samples", async () => {
    const audio = {
        sampleRate: 8000,
        channels: [
            new Float32Array([0.2, 1.6, NaN]),
            new Float32Array([Infinity, -2.4, -Infinity])
        ]
    };
    const bytes = encodeAudio(audio);
    const result = await decodeWaveWithPeak(
        bytes,
        new AbortController().signal
    );
    expect(result.audio).toEqual(decodeWave(bytes));
    expect(result.audio.channels[1]).toEqual(new Float32Array([0, -2.4, 0]));
    expect(result.peak).toBeCloseTo(2.4);
});

it("cancels peak decoding between blocks without publishing partial audio", async () => {
    vi.useFakeTimers();
    const bytes = encodeAudio({
        sampleRate: 8000,
        channels: [new Float32Array(131073).fill(2)]
    });
    const controller = new AbortController();
    const result = decodeWaveWithPeak(bytes, controller.signal);
    const rejected = expect(result).rejects.toMatchObject({
        name: "AbortError"
    });
    await vi.advanceTimersToNextTimerAsync();
    controller.abort();
    await vi.runAllTimersAsync();
    await rejected;
});

it("rejects a cancelled peak decode before reading audio", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
        decodeWaveWithPeak(new Uint8Array(), controller.signal)
    ).rejects.toMatchObject({ name: "AbortError" });
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
