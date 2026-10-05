import { rawToWave, readWave } from "../csound/wave-files";
import type { AudioData } from "./types";

export const durationOf = (audio: AudioData) =>
    audio.channels[0].length / audio.sampleRate;

export function decodeWave(bytes: Uint8Array): AudioData {
    const wave = readWave(bytes);
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

export async function decodeAudio(bytes: Uint8Array): Promise<AudioData> {
    try {
        // Preserve the native rate for WAV, regardless of the audio device's rate.
        return decodeWave(bytes);
    } catch {
        const context = new AudioContext();
        try {
            const buffer = await context.decodeAudioData(bytes.slice().buffer);
            return {
                sampleRate: buffer.sampleRate,
                channels: Array.from(
                    { length: buffer.numberOfChannels },
                    (_, index) => buffer.getChannelData(index).slice()
                )
            };
        } finally {
            await context.close();
        }
    }
}

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
