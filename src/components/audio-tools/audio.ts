import { readWave } from "../csound/wave-files";
import type { AudioData } from "./types";
import { checkAudioBytes, checkAudioLayout } from "./limits";

/** Return the shared channel duration in seconds. */
export const durationOf = (audio: AudioData) =>
    audio.channels[0].length / audio.sampleRate;

/** Validate WAV metadata, then convert in blocks so file loading can yield and cancel. */
function* waveDecoder(
    bytes: Uint8Array,
    peak?: { value: number }
): Generator<void, AudioData> {
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
    let maximum = 0;
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
            if (peak)
                maximum = Math.max(maximum, Math.abs(channels[channel][frame]));
        }
    }
    if (peak) peak.value = maximum;
    return { channels, sampleRate: wave.sampleRate };
}

/** Decode a bounded PCM WAV without changing its sample rate. */
export function decodeWave(bytes: Uint8Array): AudioData {
    const decoder = waveDecoder(bytes);
    let step = decoder.next();
    while (!step.done) step = decoder.next();
    return step.value;
}

async function decodeWaveAsync(
    bytes: Uint8Array,
    signal: AbortSignal,
    peak?: { value: number }
): Promise<AudioData> {
    signal.throwIfAborted();
    const decoder = waveDecoder(bytes, peak);
    let step = decoder.next();
    while (!step.done) {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        signal.throwIfAborted();
        step = decoder.next();
    }
    return step.value;
}

/** Measure a WAV's decoded peak in the same pass that reads its samples. */
export async function decodeWaveWithPeak(
    bytes: Uint8Array,
    signal: AbortSignal
) {
    const peak = { value: 0 };
    const audio = await decodeWaveAsync(bytes, signal, peak);
    return { audio, peak: peak.value };
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
        return decodeWaveAsync(bytes, signal);
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

/** Allocate a zero-filled float WAV with its format, frame count and data header. */
function createFloatWave(sampleRate: number, frames: number, channels: number) {
    if (!Number.isInteger(sampleRate) || sampleRate <= 0)
        throw new Error("Invalid audio layout.");
    checkAudioLayout(frames, channels);
    // WAVEFORMATEX float header plus fact and data chunks.
    const bytes = new Uint8Array(58 + frames * channels * 4);
    const view = new DataView(bytes.buffer);
    const text = (offset: number, value: string) =>
        bytes.set(new TextEncoder().encode(value), offset);
    text(0, "RIFF");
    view.setUint32(4, bytes.length - 8, true);
    text(8, "WAVEfmt ");
    view.setUint32(16, 18, true);
    view.setUint16(20, 3, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * 4, true);
    view.setUint16(32, channels * 4, true);
    view.setUint16(34, 32, true);
    text(38, "fact");
    view.setUint32(42, 4, true);
    view.setUint32(46, frames, true);
    text(50, "data");
    view.setUint32(54, bytes.length - 58, true);
    return bytes;
}

/** Yield before allocating silence; zero-filled WAV data needs no sample loop. */
export async function encodeSilenceAsync(
    sampleRate: number,
    frames: number,
    channels: number,
    signal: AbortSignal
): Promise<Uint8Array> {
    signal.throwIfAborted();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    signal.throwIfAborted();
    return createFloatWave(sampleRate, frames, channels);
}

/** Pack one float WAV buffer in blocks, keeping selection and channel order exact. */
function* waveEncoder(
    audio: AudioData,
    range: [number, number],
    channel?: number
): Generator<void, Uint8Array> {
    if (
        !Number.isInteger(audio.sampleRate) ||
        audio.sampleRate <= 0 ||
        !audio.channels.length ||
        audio.channels.some(
            (samples) => samples.length !== audio.channels[0].length
        )
    )
        throw new Error("Invalid audio layout.");
    if (
        range.some((value) => !Number.isFinite(value)) ||
        range[0] < 0 ||
        range[1] > durationOf(audio) + 0.001
    )
        throw new Error("Choose a valid audio range.");
    const first = Math.round(range[0] * audio.sampleRate);
    const end = Math.min(
        audio.channels[0].length,
        Math.round(range[1] * audio.sampleRate)
    );
    const channels =
        channel === undefined ? audio.channels : [audio.channels[channel]];
    if (end <= first || channels.some((value) => !value))
        throw new Error("Select a non-empty audio range.");
    checkAudioLayout(end - first, channels.length);
    yield;
    const bytes = createFloatWave(
        audio.sampleRate,
        end - first,
        channels.length
    );
    const view = new DataView(bytes.buffer);
    const blockFrames = Math.max(1, Math.floor(65536 / channels.length));
    for (let frame = first; frame < end; frame++) {
        if (frame > first && (frame - first) % blockFrames === 0) yield;
        for (let index = 0; index < channels.length; index++) {
            view.setFloat32(
                58 + ((frame - first) * channels.length + index) * 4,
                channels[index][frame],
                true
            );
        }
    }
    return bytes;
}

/** Encode synchronously for small fixtures and non-interactive callers. UI callers use encodeAudioAsync. */
export function encodeAudio(
    audio: AudioData,
    range: [number, number] = [0, durationOf(audio)],
    channel?: number
): Uint8Array {
    const encoder = waveEncoder(audio, range, channel);
    let step = encoder.next();
    while (!step.done) step = encoder.next();
    return step.value;
}

/** Yield between encoding blocks and stop before publishing cancelled output. */
export async function encodeAudioAsync(
    audio: AudioData,
    signal: AbortSignal,
    range: [number, number] = [0, durationOf(audio)],
    channel?: number
): Promise<Uint8Array> {
    signal.throwIfAborted();
    const encoder = waveEncoder(audio, range, channel);
    let step = encoder.next();
    while (!step.done) {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        signal.throwIfAborted();
        step = encoder.next();
    }
    return step.value;
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
