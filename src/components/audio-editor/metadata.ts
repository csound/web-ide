import { parseBuffer } from "music-metadata";

export type InfoRow = { label: string; value: string };
export type AudioInfo = {
    container?: string;
    codec?: string;
    sampleRate?: number;
    channels?: number;
    bits?: number;
    frames?: number;
    duration?: number;
    bitrate?: number;
    instrument: InfoRow[];
    broadcast: InfoRow[];
    tags: InfoRow[];
};

/** Read optional sampler and broadcast chunks that browser decoders discard.
 * Chunk sizes and loop counts are bounded by the actual file, never trusted.
 */
export function readSampleChunks(bytes: Uint8Array) {
    const instrument: InfoRow[] = [],
        broadcast: InfoRow[] = [];
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const text = (start: number, size: number) =>
        new TextDecoder()
            .decode(bytes.subarray(start, start + size))
            .replace(/\0[\s\S]*$/, "")
            .trim();
    const wave = text(0, 4) === "RIFF" && text(8, 4) === "WAVE";
    const aiff = text(0, 4) === "FORM" && ["AIFF", "AIFC"].includes(text(8, 4));
    if (!wave && !aiff) return { instrument, broadcast };
    const chunks = new Map<string, { start: number; size: number }>();
    for (let offset = 12; offset + 8 <= bytes.length; ) {
        const size = view.getUint32(offset + 4, wave),
            start = offset + 8;
        if (start + size > bytes.length) break;
        chunks.set(text(offset, 4), { start, size });
        offset = start + size + (size % 2);
    }
    const row = (label: string, value: string | number) =>
        instrument.push({ label, value: String(value) });
    const inst = chunks.get(wave ? "inst" : "INST");
    if (inst && inst.size >= (wave ? 7 : 20)) {
        const p = inst.start;
        row("Base note", view.getUint8(p));
        row("Detune", `${view.getInt8(p + 1)} cents`);
        row("Gain", `${wave ? view.getInt8(p + 2) : view.getInt16(p + 6)} dB`);
        row(
            "Key range",
            `${view.getUint8(p + (wave ? 3 : 2))} - ${view.getUint8(p + (wave ? 4 : 3))}`
        );
        row(
            "Velocity range",
            `${view.getUint8(p + (wave ? 5 : 4))} - ${view.getUint8(p + (wave ? 6 : 5))}`
        );
        if (aiff) {
            const markers = new Map<number, number>();
            const mark = chunks.get("MARK");
            if (mark && mark.size >= 2) {
                let at = mark.start + 2;
                for (
                    let i = 0;
                    i < view.getUint16(mark.start) &&
                    at + 7 <= mark.start + mark.size;
                    i++
                ) {
                    markers.set(view.getInt16(at), view.getUint32(at + 2));
                    const length = view.getUint8(at + 6);
                    at += 7 + length + (length % 2 === 0 ? 1 : 0);
                }
            }
            for (const [label, offset] of [
                ["Sustain loop", 8],
                ["Release loop", 14]
            ] as const) {
                const mode = view.getUint16(p + offset);
                if (mode) {
                    const startId = view.getInt16(p + offset + 2),
                        endId = view.getInt16(p + offset + 4);
                    row(
                        label,
                        `${mode === 1 ? "Forward" : mode === 2 ? "Alternating" : `Mode ${mode}`}: ${markers.get(startId) ?? `marker ${startId}`} to ${markers.get(endId) ?? `marker ${endId}`} frames`
                    );
                }
            }
        }
    }
    const sampler = chunks.get("smpl");
    if (wave && sampler && sampler.size >= 36) {
        const p = sampler.start;
        if (!inst) row("Base note", view.getUint32(p + 12, true));
        const count = Math.min(
            view.getUint32(p + 28, true),
            Math.floor((sampler.size - 36) / 24)
        );
        row("Loop count", count);
        for (let i = 0; i < Math.min(count, 64); i++) {
            const at = p + 36 + i * 24;
            const mode = view.getUint32(at + 4, true),
                repeats = view.getUint32(at + 20, true);
            row(
                `Loop ${i + 1}`,
                `${["Forward", "Alternating", "Backward"][mode] ?? `Mode ${mode}`}: ${view.getUint32(at + 8, true)} to ${view.getUint32(at + 12, true)} frames; ${repeats ? `${repeats} repeats` : "continuous"}`
            );
        }
    }
    const bext = chunks.get("bext");
    if (wave && bext && bext.size >= 602) {
        const p = bext.start;
        for (const [label, offset, length] of [
            ["Description", 0, 256],
            ["Originator", 256, 32],
            ["Originator reference", 288, 32],
            ["Date", 320, 10],
            ["Time", 330, 8],
            ["Coding history", 602, Math.min(bext.size - 602, 8192)]
        ] as const) {
            const value = text(p + offset, length);
            if (value) broadcast.push({ label, value });
        }
        broadcast.push({
            label: "Time reference (frames)",
            value: view.getBigUint64(p + 338, true).toString()
        });
        broadcast.push({
            label: "BWF version",
            value: String(view.getUint16(p + 346, true))
        });
        const umid = bytes.subarray(p + 348, p + 412);
        if (umid.some(Boolean))
            broadcast.push({
                label: "UMID",
                value: Array.from(umid, (byte) =>
                    byte.toString(16).padStart(2, "0")
                ).join("")
            });
    }
    return { instrument, broadcast };
}

/** File properties come from encoded headers, not a resampled AudioBuffer. */
export async function readAudioInfo(bytes: Uint8Array): Promise<AudioInfo> {
    const { format, common } = await parseBuffer(bytes, undefined, {
        duration: true,
        skipCovers: true
    });
    return {
        container: format.container,
        codec: format.codec,
        sampleRate: format.sampleRate,
        channels: format.numberOfChannels,
        bits: format.bitsPerSample,
        frames: format.numberOfSamples,
        duration: format.duration,
        bitrate: format.bitrate,
        ...readSampleChunks(bytes),
        tags: Object.entries({
            Title: common.title,
            Artist: common.artist,
            Album: common.album
        }).flatMap(([label, value]) => (value ? [{ label, value }] : []))
    };
}
