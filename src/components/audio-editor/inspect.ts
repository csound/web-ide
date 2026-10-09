import type { AudioData } from "../audio-tools/types";
import type { AudioInfo } from "./metadata";

/** Own and terminate a metadata worker on completion, cancellation, or timeout. */
export function inspectMetadata(
    bytes: Uint8Array,
    signal: AbortSignal
): Promise<AudioInfo> {
    signal.throwIfAborted();
    return new Promise((resolve, reject) => {
        const worker = new Worker(
            new URL("./metadata-worker.ts", import.meta.url),
            { type: "module" }
        );
        const finish = (error?: Error, info?: AudioInfo) => {
            clearTimeout(timer);
            signal.removeEventListener("abort", abort);
            worker.terminate();
            if (error) reject(error);
            else if (info) resolve(info);
        };
        const abort = () => finish(new DOMException("Cancelled", "AbortError"));
        const timer = setTimeout(
            () => finish(new Error("Reading file metadata took too long.")),
            30_000
        );
        signal.addEventListener("abort", abort, { once: true });
        worker.onerror = () =>
            finish(new Error("Could not read file metadata."));
        worker.onmessage = ({ data }) =>
            finish(data.error ? new Error(data.error) : undefined, data.info);
        try {
            const copy = bytes.slice();
            worker.postMessage(copy, [copy.buffer]);
        } catch {
            finish(new Error("Could not inspect this audio file."));
        }
    });
}

export type ChannelStats = {
    peak: number;
    rms: number;
    dc: number;
    clipped: number;
};
export type AudioScan = { peaks: [number, number][]; channels: ChannelStats[] };

/** Scan once for waveform and channel levels, yielding and checking cancellation between blocks. */
export async function scanAudio(
    audio: AudioData,
    signal: AbortSignal
): Promise<AudioScan> {
    const frames = audio.channels[0].length;
    const step = Math.max(1, Math.ceil(frames / 800));
    const peaks: [number, number][] = Array.from(
        { length: Math.ceil(frames / step) },
        () => [0, 0]
    );
    const channels: ChannelStats[] = [];
    for (const samples of audio.channels) {
        let peak = 0,
            squares = 0,
            sum = 0,
            clipped = 0;
        for (let start = 0; start < frames; start += 65536) {
            signal.throwIfAborted();
            for (let i = start; i < Math.min(frames, start + 65536); i++) {
                const sample = samples[i],
                    abs = Math.abs(sample);
                peak = Math.max(peak, abs);
                squares += sample * sample;
                sum += sample;
                if (abs >= 1) clipped++;
                const pair = peaks[Math.floor(i / step)];
                pair[0] = Math.min(pair[0], sample);
                pair[1] = Math.max(pair[1], sample);
            }
            await new Promise<void>((resolve) => setTimeout(resolve, 0));
        }
        channels.push({
            peak,
            rms: Math.sqrt(squares / frames),
            dc: sum / frames,
            clipped
        });
    }
    signal.throwIfAborted();
    return { peaks, channels };
}
