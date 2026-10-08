// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { readAudioStream, MAX_AUDIO_BYTES, MAX_AUDIO_SAMPLES } from "./limits";
import { decodeAudio, decodeWave } from "./audio";
import { rawToWave } from "../csound/wave-files";

afterEach(() => vi.unstubAllGlobals());

/** Supply a stream whose cancellation and byte consumption can be observed. */
function source(chunks: Uint8Array[]) {
    const cancel = vi.fn();
    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            for (const chunk of chunks) controller.enqueue(chunk);
        },
        cancel
    });
    return { stream, cancel };
}

it("cancels oversized responses before reading when their size is known", async () => {
    const { stream, cancel } = source([]);
    await expect(
        readAudioStream(
            stream,
            new AbortController().signal,
            MAX_AUDIO_BYTES + 1
        )
    ).rejects.toThrow("64 MB");
    expect(cancel).toHaveBeenCalledOnce();
});

it.each([undefined, 1])(
    "enforces the byte cap despite missing or false size %s",
    async (size) => {
        const { stream, cancel } = source([
            new Uint8Array(MAX_AUDIO_BYTES),
            new Uint8Array(1)
        ]);
        await expect(
            readAudioStream(stream, new AbortController().signal, size)
        ).rejects.toThrow("64 MB");
        expect(cancel).toHaveBeenCalledOnce();
    }
);

it("cancels a stalled read and rejects it", async () => {
    const { stream, cancel } = source([]);
    const controller = new AbortController();
    const result = readAudioStream(stream, controller.signal);
    controller.abort();
    await expect(result).rejects.toMatchObject({ name: "AbortError" });
    expect(cancel).toHaveBeenCalledOnce();
});

it.each([undefined, 1, 20])(
    "uses the caller's smaller data-file limit for size %s",
    async (size) => {
        const { stream, cancel } = source([
            new Uint8Array(8),
            new Uint8Array(8)
        ]);
        const limit = (size: number) => {
            if (size > 10) throw new Error("Data limit");
        };
        await expect(
            readAudioStream(stream, new AbortController().signal, size, limit)
        ).rejects.toThrow("Data limit");
        expect(cancel).toHaveBeenCalledOnce();
    }
);

it("joins a completed bounded stream", async () => {
    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            controller.enqueue(new Uint8Array([1, 2]));
            controller.enqueue(new Uint8Array([3]));
            controller.close();
        }
    });
    expect(await readAudioStream(stream, new AbortController().signal)).toEqual(
        new Uint8Array([1, 2, 3])
    );
});

it("rejects oversized 8-bit WAV before float allocation, without browser fallback", async () => {
    const bytes = rawToWave(
        new Uint8Array(MAX_AUDIO_SAMPLES + 1),
        8000,
        1,
        "8",
        1
    );
    const floatArray = vi.fn(function () {
        throw new Error("Allocated float samples");
    });
    const browserDecoder = vi.fn();
    vi.stubGlobal("Float32Array", floatArray);
    vi.stubGlobal("AudioContext", browserDecoder);
    expect(() => decodeWave(bytes)).toThrow("too large");
    await expect(decodeAudio(bytes)).rejects.toThrow("too large");
    expect(floatArray).not.toHaveBeenCalled();
    expect(browserDecoder).not.toHaveBeenCalled();
});

it("rejects too many WAV channels before allocation", () => {
    const bytes = rawToWave(new Uint8Array(9), 8000, 9, "8", 1);
    vi.stubGlobal(
        "Float32Array",
        vi.fn(function () {
            throw new Error("Allocated float samples");
        })
    );
    expect(() => decodeWave(bytes)).toThrow("up to 8 channels");
});

it("yields during WAV conversion so a load can be cancelled", async () => {
    const bytes = rawToWave(new Uint8Array(131072), 8000, 1, "8", 1);
    const controller = new AbortController();
    const result = decodeAudio(bytes, controller.signal);
    controller.abort();
    await expect(result).rejects.toMatchObject({ name: "AbortError" });
});

it("rejects oversized browser output before copying channels", async () => {
    const copy = vi.fn();
    const close = vi.fn(async () => {});
    vi.stubGlobal(
        "AudioContext",
        vi.fn(function () {
            return {
                decodeAudioData: async () => ({
                    length: MAX_AUDIO_SAMPLES + 1,
                    numberOfChannels: 1,
                    getChannelData: copy
                }),
                close
            };
        })
    );
    await expect(decodeAudio(new Uint8Array([1]))).rejects.toThrow("too large");
    expect(copy).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledOnce();
});

it("closes and abandons native decoding on cancellation", async () => {
    const close = vi.fn(async () => {});
    vi.stubGlobal(
        "AudioContext",
        vi.fn(function () {
            return {
                decodeAudioData: () => new Promise(() => {}),
                close
            };
        })
    );
    const controller = new AbortController();
    const result = decodeAudio(new Uint8Array([1]), controller.signal);
    controller.abort();
    await expect(result).rejects.toMatchObject({ name: "AbortError" });
    expect(close).toHaveBeenCalledOnce();
});
