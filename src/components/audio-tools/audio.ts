import { rawToWave, readWave } from "../csound/wave-files";
import type { AudioData } from "./types";
import { checkAudioBytes, checkAudioLayout } from "./limits";

/** Return the shared channel duration in seconds. */
export const durationOf = (audio: AudioData) =>
    audio.channels[0].length / audio.sampleRate;

/** Validate WAV metadata, then convert in blocks so file loading can yield and cancel. */
function* waveDecoder(bytes: Uint8Array): Generator<void, AudioData> {
    checkAudioBytes(bytes.length);
    const wave = readWave(bytes);
    checkAudioLayout(wave.frames, wave.channels);
    if (wave.format === 3 && ![32, 64].includes(wave.bits))
        throw new Error("Unsupported WAV sample format.");
    const view = new DataView(
        wave.data.buffer,
        wave.data.byteOffset,
        wave.data.byteLength
    );
    const channels = Array.from(
        { length: wave.channels },
        () => new Float32Array(wave.frames)
    );
    const step = wave.bits / 8;
    for (let frame = 0; frame < wave.frames; frame++) {
        if (frame % 65536 === 0) yield;
        for (let channel = 0; channel < wave.channels; channel++) {
            const offset = (frame * wave.channels + channel) * step;
            let sample: number;
            if (wave.format === 3)
                sample =
                    wave.bits === 64
                        ? view.getFloat64(offset, true)
                        : view.getFloat32(offset, true);
            else if (wave.bits === 8)
                sample = (view.getUint8(offset) - 128) / 128;
            else if (wave.bits === 16)
                sample = view.getInt16(offset, true) / 32768;
            else if (wave.bits === 24) {
                const value =
                    view.getUint8(offset) |
                    (view.getUint8(offset + 1) << 8) |
                    (view.getInt8(offset + 2) << 16);
                sample = value / 8388608;
            } else if (wave.bits === 32)
                sample = view.getInt32(offset, true) / 2147483648;
            else throw new Error("Unsupported WAV sample format.");
            channels[channel][frame] = Number.isFinite(sample) ? sample : 0;
        }
    }
    return { channels, sampleRate: wave.sampleRate };
}

/** Decode a bounded PCM WAV without changing its sample rate. */
export function decodeWave(bytes: Uint8Array): AudioData {
    const decoder = waveDecoder(bytes);
    let step = decoder.next();
    while (!step.done) step = decoder.next();
    return step.value;
}

/** Load WAV in cancellable blocks; use the browser decoder for other audio formats.
 * Browser decoding cannot impose a PCM allocation cap. Check its output before
 * copying channels, and close its context on cancellation to release resources.
 */
export async function decodeAudio(
    bytes: Uint8Array,
    signal: AbortSignal = new AbortController().signal
): Promise<AudioData> {
    signal.throwIfAborted();
    checkAudioBytes(bytes.length);
    const signature = new TextDecoder().decode(bytes.subarray(0, 12));
    if (signature.startsWith("RIFF") && signature.endsWith("WAVE")) {
        // Do not send invalid or oversized WAV to the browser decoder as a fallback.
        const decoder = waveDecoder(bytes);
        let step = decoder.next();
        while (!step.done) {
            await new Promise<void>((resolve) => setTimeout(resolve, 0));
            signal.throwIfAborted();
            step = decoder.next();
        }
        return step.value;
    }
    const context = new AudioContext();
    let closed: Promise<void> | undefined;
    const close = () => (closed ??= context.close());
    let abort: () => void = () => {};
    try {
        const cancelled = new Promise<never>((_, reject) => {
            abort = () => {
                void close().catch(() => {});
                reject(signal.reason);
            };
            signal.addEventListener("abort", abort, { once: true });
        });
        const buffer = await Promise.race([
            context.decodeAudioData(bytes.slice().buffer),
            cancelled
        ]);
        signal.throwIfAborted();
        checkAudioLayout(buffer.length, buffer.numberOfChannels);
        return {
            sampleRate: buffer.sampleRate,
            channels: Array.from(
                { length: buffer.numberOfChannels },
                (_, index) => buffer.getChannelData(index).slice()
            )
        };
    } finally {
        signal.removeEventListener("abort", abort);
        // Do not hold cancellation hostage to a browser's native decoder shutdown.
        void close().catch(() => {});
    }
}

/** Write float WAV frames for a selected interval and optional single channel. */
export function encodeAudio(
    audio: AudioData,
    range: [number, number] = [0, durationOf(audio)],
    channel?: number
): Uint8Array {
    if (
        range.some((value) => !Number.isFinite(value)) ||
        range[0] < 0 ||
        range[1] > durationOf(audio) + 0.001
    )
        throw new Error("Choose a valid audio range.");
    const first = Math.max(0, Math.round(range[0] * audio.sampleRate));
    const end = Math.min(
        audio.channels[0].length,
        Math.round(range[1] * audio.sampleRate)
    );
    const channels =
        channel === undefined ? audio.channels : [audio.channels[channel]];
    if (end <= first || channels.some((value) => !value))
        throw new Error("Select a non-empty audio range.");
    const bytes = new Uint8Array((end - first) * channels.length * 4);
    const view = new DataView(bytes.buffer);
    for (let frame = first; frame < end; frame++) {
        for (let index = 0; index < channels.length; index++) {
            view.setFloat32(
                ((frame - first) * channels.length + index) * 4,
                channels[index][frame],
                true
            );
        }
    }
    return rawToWave(bytes, audio.sampleRate, channels.length, "float", 1);
}

/** Reduce every channel to min/max pairs for a bounded waveform preview. */
export function waveformPeaks(
    audio: AudioData,
    columns = 800
): [number, number][] {
    const frames = audio.channels[0].length;
    const step = Math.max(1, Math.ceil(frames / columns));
    const peaks: [number, number][] = [];
    for (let start = 0; start < frames; start += step) {
        let min = 0,
            max = 0;
        for (const channel of audio.channels) {
            for (
                let frame = start;
                frame < Math.min(frames, start + step);
                frame++
            ) {
                min = Math.min(min, channel[frame]);
                max = Math.max(max, channel[frame]);
            }
        }
        peaks.push([min, max]);
    }
    return peaks;
}
