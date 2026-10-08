import type { Plot } from "../audio-tools/types";
export const MAX_SDIF_BYTES = 32 * 1024 * 1024;
const MAX_POINTS = 500_000;
export const MAX_DURATION = 32.76;
export type TrackPoint = {
    frame: number;
    frequency: number;
    amplitude: number;
};
export type SdifStream = {
    id: number;
    times: number[];
    tracks: Map<number, TrackPoint[]>;
};
export type StreamInfo = {
    id: number;
    frames: number;
    partials: number;
    start: number;
    end: number;
};
export type Settings = {
    stream: number;
    start: number;
    end: number;
    partials: number;
    gain: number;
};
export type AdTrack = { id: number; points: Int16Array };
export const checkSdifSize = (size: number) => {
    if (size > MAX_SDIF_BYTES)
        throw new Error("Use an SDIF file smaller than 32 MB.");
};
/** Walk byte counts and matrix padding before passing any source data to native code. */
export function readSdif(bytes: Uint8Array): SdifStream[] {
    checkSdifSize(bytes.length);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const tag = (i: number) => String.fromCharCode(...bytes.subarray(i, i + 4));
    const bad = () =>
        new Error(
            "This SDIF file has an incomplete or invalid frame or matrix."
        );
    if (bytes.length < 16 || tag(0) !== "SDIF")
        throw new Error("Choose an SDIF file containing 1TRC partial tracks.");
    const header = view.getUint32(4);
    if (
        header < 8 ||
        header % 8 ||
        header + 8 > bytes.length ||
        view.getUint32(8) !== 3 ||
        view.getUint32(12) < 1
    )
        throw bad();
    const streams = new Map<number, SdifStream>();
    let points = 0;
    for (let offset = header + 8; offset < bytes.length; ) {
        if (offset + 8 > bytes.length) throw bad();
        const size = view.getUint32(offset + 4),
            end = offset + 8 + size;
        if (size % 8 || end > bytes.length) throw bad();
        if (tag(offset) !== "1TRC") {
            offset = end;
            continue;
        }
        if (size < 16) throw bad();
        const time = view.getFloat64(offset + 8),
            id = view.getUint32(offset + 16),
            matrices = view.getUint32(offset + 20);
        if (!Number.isFinite(time) || time < 0)
            throw new Error(
                "1TRC frame times must be finite and non-negative."
            );
        let stream = streams.get(id);
        if (!stream) {
            if (streams.size >= 64)
                throw new Error("Use an SDIF file with up to 64 streams.");
            stream = { id, times: [], tracks: new Map() };
            streams.set(id, stream);
        }
        if (stream.times.length && time <= stream.times.at(-1)!)
            throw new Error(`Stream ${id}: frame times must increase.`);
        if (stream.times.length >= 100_000)
            throw new Error(
                "Use a shorter SDIF analysis (up to 100,000 frames per stream)."
            );
        const frame = stream.times.length,
            seen = new Set<number>();
        stream.times.push(time);
        let cursor = offset + 24;
        for (let m = 0; m < matrices; m++) {
            if (cursor + 16 > end) throw bad();
            const type = view.getUint32(cursor + 4),
                rows = view.getUint32(cursor + 8),
                columns = view.getUint32(cursor + 12);
            const width = type & 255,
                length = rows * columns * width;
            if (![1, 2, 4, 8].includes(width) || !Number.isSafeInteger(length))
                throw bad();
            const start = cursor + 16,
                next = start + Math.ceil(length / 8) * 8;
            if (next > end) throw bad();
            if (tag(cursor) === "1TRC") {
                if (![4, 8].includes(type) || columns !== 4)
                    throw new Error(
                        "1TRC matrices need four float32 or float64 columns: index, frequency, amplitude, phase."
                    );
                points += rows;
                if (points > MAX_POINTS)
                    throw new Error(
                        "Use a shorter analysis (up to 500,000 partial points)."
                    );
                for (let row = 0; row < rows; row++) {
                    const at = start + row * 4 * width;
                    const read = (column: number) =>
                        width === 4
                            ? view.getFloat32(at + column * width)
                            : view.getFloat64(at + column * width);
                    const index = read(0),
                        frequency = read(1),
                        amplitude = read(2),
                        phase = read(3);
                    if (
                        !Number.isSafeInteger(index) ||
                        index < 0 ||
                        seen.has(index)
                    )
                        throw new Error(
                            `Stream ${id}: each frame needs distinct, non-negative whole track IDs.`
                        );
                    if (
                        ![frequency, amplitude, phase].every(Number.isFinite) ||
                        amplitude < 0
                    )
                        throw new Error(
                            `Track ${index} at ${time.toFixed(4)} s: invalid frequency (${frequency}), amplitude (${amplitude}), or phase (${phase}). All values must be finite and amplitudes must be non-negative.`
                        );
                    seen.add(index);
                    const track = stream.tracks.get(index) || [];
                    track.push({ frame, frequency, amplitude });
                    stream.tracks.set(index, track);
                }
            }
            cursor = next;
        }
        if (cursor !== end) throw bad();
        offset = end;
    }
    const result = [...streams.values()].filter((stream) => stream.tracks.size);
    if (!result.length)
        throw new Error("No 1TRC partial tracks found in this SDIF file.");
    return result;
}
export function streamInfo(streams: SdifStream[]): StreamInfo[] {
    return streams.map(({ id, times, tracks }) => ({
        id,
        frames: times.length,
        partials: tracks.size,
        start: times[0],
        end: times.at(-1)!
    }));
}
export function defaults(info: StreamInfo): Settings {
    return {
        stream: info.id,
        start: info.start,
        end: Math.min(info.end, info.start + MAX_DURATION),
        partials: Math.min(info.partials, 1024),
        gain: 0
    };
}
export type Prepared = {
    bytes: Uint8Array;
    tracks: AdTrack[];
    duration: number;
    omitted: number;
};
/** Normalize one stream: dense IDs, explicit silence for absent rows, and a bounded time window. */
export function prepare(stream: SdifStream, settings: Settings): Prepared {
    const { start, end, partials, gain } = settings,
        times = stream.times;
    if (
        ![start, end, gain].every(Number.isFinite) ||
        start < times[0] ||
        end > times.at(-1)! ||
        end <= start ||
        end - start > MAX_DURATION + 1e-9
    )
        throw new Error(
            "Choose a range within the stream, longer than 0 and no longer than 32.76 seconds."
        );
    if (!Number.isInteger(partials) || partials < 1 || partials > 1024)
        throw new Error("Keep between 1 and 1024 partials.");
    if (gain < -60 || gain > 24)
        throw new Error("Gain must be from -60 to +24 dB.");
    const entries = [...stream.tracks]
        .sort(([a], [b]) => a - b)
        .slice(0, partials);
    const frameTimes = [
        start,
        ...times.filter((t) => t > start && t < end),
        end
    ];
    if (frameTimes.length * entries.length > MAX_POINTS)
        throw new Error(
            "This range has too many output points. Keep fewer partials or choose a shorter range."
        );
    const gainFactor = 10 ** (gain / 20);
    // Only unique millisecond positions can be represented. Keep the latest frame in each bin.
    const selected: {
        time: number;
        milliseconds: number;
        left: number;
        right: number;
        mix: number;
    }[] = [];
    let right = 0;
    for (const time of frameTimes) {
        while (right < times.length - 1 && times[right] < time) right++;
        const left = times[right] === time ? right : Math.max(0, right - 1);
        const mix =
            left === right
                ? 0
                : (time - times[left]) / (times[right] - times[left]);
        const milliseconds = Math.trunc(
            Math.fround(Math.fround(time - start) * 1000)
        );
        const entry = {
            time: Math.fround(time - start),
            milliseconds,
            left,
            right,
            mix
        };
        if (selected.at(-1)?.milliseconds === milliseconds)
            selected[selected.length - 1] = entry;
        else selected.push(entry);
    }
    if (selected.length < 2)
        throw new Error(
            "Choose a range spanning at least two distinct milliseconds."
        );
    const values = entries.map(([id, points]) => {
        const byFrame = new Map(points.map((p) => [p.frame, p]));
        let heldFrequency = points[0].frequency;
        // Carry the most recent frequency through silent frames, including before the window.
        for (const p of points) {
            if (times[p.frame] > start) break;
            heldFrequency = p.frequency;
        }
        const output = new Int16Array(selected.length * 3);
        const floats: [number, number][] = [];
        selected.forEach(({ milliseconds, left, right, mix }, i) => {
            const a = byFrame.get(left),
                b = byFrame.get(right);
            const firstFrequency = a?.frequency ?? heldFrequency;
            const frequency =
                firstFrequency +
                ((b?.frequency ?? firstFrequency) - firstFrequency) * mix;
            const amplitude =
                (a?.amplitude ?? 0) +
                ((b?.amplitude ?? 0) - (a?.amplitude ?? 0)) * mix;
            heldFrequency = b?.frequency ?? firstFrequency;
            const f = Math.fround(frequency),
                amp = Math.fround(amplitude * gainFactor);
            if (!Number.isFinite(f) || f < 0 || f > 32767)
                throw new Error(
                    `Track ${id}: adsyn supports frequencies from 0 to 32767 Hz.`
                );
            if (!Number.isFinite(amp) || amp > 1)
                throw new Error(
                    `Track ${id} exceeds full amplitude. Lower the gain before exporting.`
                );
            const t = milliseconds;
            output.set(
                [t, Math.trunc(Math.fround(32767 * amp)), Math.trunc(f)],
                i * 3
            );
            floats.push([f, amp]);
        });
        return { id, points: output, floats };
    });
    // Native sdif2ad does not skip unrelated frames/streams correctly. Give it
    // only validated float32 1TRC matrices and remap arbitrary IDs to 1..N.
    const frameSize = 40 + entries.length * 16;
    const bytes = new Uint8Array(16 + selected.length * frameSize),
        view = new DataView(bytes.buffer);
    const tag = (offset: number, text: string) =>
        bytes.set(new TextEncoder().encode(text), offset);
    tag(0, "SDIF");
    view.setUint32(4, 8);
    view.setUint32(8, 3);
    view.setUint32(12, 1);
    selected.forEach(({ time }, frame) => {
        const offset = 16 + frame * frameSize;
        tag(offset, "1TRC");
        view.setUint32(offset + 4, frameSize - 8);
        view.setFloat64(offset + 8, time);
        view.setUint32(offset + 16, 1);
        view.setUint32(offset + 20, 1);
        tag(offset + 24, "1TRC");
        view.setUint32(offset + 28, 4);
        view.setUint32(offset + 32, entries.length);
        view.setUint32(offset + 36, 4);
        values.forEach(({ floats }, track) => {
            const at = offset + 40 + track * 16;
            view.setFloat32(at, track + 1);
            view.setFloat32(at + 4, floats[frame][0]);
            view.setFloat32(at + 8, floats[frame][1]);
        });
    });
    return {
        bytes,
        tracks: values.map(({ id, points }) => ({ id, points })),
        duration: selected.at(-1)!.milliseconds / 1000,
        omitted: stream.tracks.size - entries.length
    };
}
/** Verify every native breakpoint against the prepared stream before exposing output. */
export function verifyAds(bytes: Uint8Array, tracks: AdTrack[]) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let offset = 0;
    const read = () => {
        if (offset + 2 > bytes.length)
            throw new Error("The converter returned incomplete adsyn data.");
        const n = view.getInt16(offset, true);
        offset += 2;
        return n;
    };
    const expect = (n: number) => {
        if (read() !== n)
            throw new Error(
                "The converter changed a partial unexpectedly. No result was saved."
            );
    };
    expect(tracks.length);
    for (const { points } of tracks)
        for (const kind of [1, 2]) {
            expect(-kind);
            for (let i = 0; i < points.length; i += 3) {
                expect(points[i]);
                expect(points[i + kind]);
            }
            expect(32767);
        }
    if (offset !== bytes.length)
        throw new Error("The converter returned extra adsyn data.");
}
export function trackPlot(
    track: AdTrack,
    frequency: boolean,
    duration: number
): Plot {
    const count = track.points.length / 3,
        step = Math.max(1, Math.ceil(count / 500)),
        series: [number, number][] = [];
    let max = 1;
    const column = frequency ? 2 : 1;
    for (let i = 0; i < count; i += step) {
        let low = i,
            high = i;
        for (let j = i; j < Math.min(count, i + step); j++) {
            if (track.points[j * 3 + column] < track.points[low * 3 + column])
                low = j;
            if (track.points[j * 3 + column] > track.points[high * 3 + column])
                high = j;
        }
        for (const j of [
            ...new Set([i, low, high, Math.min(count - 1, i + step - 1)])
        ].sort((a, b) => a - b)) {
            const n = track.points[j * 3 + column];
            max = Math.max(max, n);
            series.push([track.points[j * 3] / 1000, n]);
        }
    }
    return {
        kind: "lines",
        label: frequency ? "Frequency" : "Amplitude",
        unit: frequency ? "Hz" : "level",
        duration: duration || 0.001,
        max,
        series: [series]
    };
}
export function exampleSdif() {
    const times = Array.from({ length: 81 }, (_, i) => i / 40);
    const stream: SdifStream = {
        id: 7,
        times,
        tracks: new Map(
            [1, 2, 3].map((id) => [
                id,
                times.map((time, frame) => ({
                    frame,
                    frequency: 220 * id + 8 * Math.sin(time * 3),
                    amplitude: (Math.sin((time * Math.PI) / 2) ** 2 * 0.25) / id
                }))
            ])
        )
    };
    return prepare(stream, {
        stream: 7,
        start: 0,
        end: 2,
        partials: 3,
        gain: 0
    }).bytes;
}
