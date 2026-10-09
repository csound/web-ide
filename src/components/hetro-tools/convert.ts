import { runTool } from "../audio-tools/runner";
import type { Plot, ToolFile } from "../audio-tools/types";

export const MAX_HETRO_BYTES = 2 * 1024 * 1024;
const END = 32767;
export type HetroTrack = { kind: -1 | -2; points: [number, number][] };
export type HetroData = {
    partials: number;
    tracks: HetroTrack[];
    duration: number;
};
export const exampleText =
    "HETRO 2,-1,0,0,40,16000,700,10000,1200,0\n-2,0,220,1200,220\n-1,0,0,20,7000,400,3000,1200,0\n-2,0,440,1200,440\n";

export function checkHetroSize(size: number) {
    if (size > MAX_HETRO_BYTES)
        throw new Error("Use a HETRO or text file smaller than 2 MB.");
}
function validate(partials: number, tracks: HetroTrack[]): HetroData {
    if (!Number.isInteger(partials) || partials < 1 || partials > 50)
        throw new Error("Use between 1 and 50 partials in the HETRO header.");
    if (tracks.length !== partials * 2)
        throw new Error(
            `The header declares ${partials} partials. Each needs one amplitude (-1) row followed by one frequency (-2) row.`
        );
    let duration = 0;
    tracks.forEach((track, row) => {
        if (track.kind !== (row % 2 ? -2 : -1))
            throw new Error(
                `Row ${row + 1}: alternate amplitude (-1) and frequency (-2) rows.`
            );
        if (track.points.length < 1)
            throw new Error(
                `Row ${row + 1}: add at least one time/value pair.`
            );
        let previous = -1;
        for (const [time, value] of track.points) {
            if (
                !Number.isInteger(time) ||
                time < 0 ||
                time >= END ||
                // hetro rounds times to milliseconds, so short clips repeat them.
                time < previous
            )
                throw new Error(
                    `Row ${row + 1}: times must not go backwards. Use whole milliseconds from 0 to 32766.`
                );
            if (!Number.isInteger(value) || value < 0 || value > END)
                throw new Error(
                    `Row ${row + 1}: values must be whole numbers from 0 to 32767.`
                );
            previous = time;
            duration = Math.max(duration, time / 1000);
        }
        if (track.points[0][0] !== 0)
            throw new Error(`Row ${row + 1}: start the first pair at 0 ms.`);
    });
    return { partials, tracks, duration };
}

/** Accept converter CSV and the explicit terminators emitted by hetro -X. */
export function parseHetroText(source: string): HetroData {
    checkHetroSize(source.length);
    const text = source.replace(/^\uFEFF/, "").trim();
    const match = /^HETRO\s+([0-9]+)(?=\s|,|$)/.exec(text);
    if (!match)
        throw new Error(
            "Start with HETRO and the number of partials (for example, HETRO 2)."
        );
    const body = text.slice(match[0].length).trim().replace(/^,/, "");
    const tracks = body
        .split(/\r?\n/)
        .filter((line) => line.trim())
        .map((line, row): HetroTrack => {
            const tokens = line.split(",").map((token) => token.trim());
            if (tokens.some((token) => !/^-?\d{1,5}$/.test(token)))
                throw new Error(
                    `Row ${row + 1}: use comma-separated whole numbers, without empty fields.`
                );
            const values = tokens.map(Number);
            // Explicit END belongs after all pairs; a value of 32767 is also valid.
            if (values.length % 2 === 0 && values.at(-1) === END) values.pop();
            if (values.length % 2 !== 1)
                throw new Error(
                    `Row ${row + 1}: each time needs a matching value.`
                );
            const points: [number, number][] = [];
            for (let index = 1; index < values.length; index += 2)
                points.push([values[index], values[index + 1]]);
            return { kind: values[0] as -1 | -2, points };
        });
    return validate(Number(match[1]), tracks);
}

/** Parse WASI's little-endian binary format before invoking the permissive native exporter. */
export function parseHetroBinary(bytes: Uint8Array): HetroData {
    checkHetroSize(bytes.length);
    if (bytes.length < 2 || bytes.length % 2)
        throw new Error("This HETRO file is truncated.");
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let offset = 0;
    const read = () => {
        if (offset + 2 > bytes.length)
            throw new Error(
                "This HETRO file has an unfinished breakpoint row."
            );
        const value = view.getInt16(offset, true);
        offset += 2;
        return value;
    };
    const header = read();
    if (header === -1)
        offset = 0; // Older adsyn files omit the partial count.
    else if (header < 1 || header > 50)
        throw new Error(
            "Choose a little-endian HETRO analysis with up to 50 partials."
        );
    const tracks: HetroTrack[] = [];
    while (offset < bytes.length) {
        if (tracks.length >= 100)
            throw new Error("Use up to 50 HETRO partials.");
        const kind = read();
        const points: [number, number][] = [];
        for (;;) {
            const time = read();
            if (time === END) break;
            points.push([time, read()]);
        }
        tracks.push({ kind: kind as -1 | -2, points });
    }
    return validate(header === -1 ? tracks.length / 2 : header, tracks);
}

/** Keep the header on the first data row: het_import appends END for every newline. */
export function formatHetro(data: HetroData) {
    const text =
        `HETRO ${data.partials},` +
        data.tracks
            .map((track) => [track.kind, ...track.points.flat()].join(","))
            .join("\n") +
        "\n";
    checkHetroSize(text.length);
    return text;
}

/** Read native binary or the text analysis already produced by Audio Analysis. */
export async function openHetro(
    file: ToolFile,
    signal: AbortSignal,
    status: (text: string) => void
) {
    checkHetroSize(file.data.length);
    let source: string | undefined;
    try {
        source = new TextDecoder("utf-8", { fatal: true }).decode(file.data);
    } catch {
        // Binary HETRO contains bytes that are not valid UTF-8.
    }
    if (source?.trimStart().startsWith("HETRO"))
        return formatHetro(parseHetroText(source));
    const data = parseHetroBinary(file.data);
    const canonical = formatHetro(data);
    // het_export mistakes the legal maximum value for a row terminator. Preserve
    // these files exactly through our validated formatter instead of losing peaks.
    if (
        data.tracks.some((track) =>
            track.points.some(([, value]) => value === END)
        )
    )
        return canonical;
    const output = await runTool(
        {
            tool: "het_export",
            args: ["input.het", "output.txt"],
            files: [{ name: "input.het", data: file.data }],
            output: "output.txt"
        },
        signal,
        status
    );
    signal.throwIfAborted();
    let text = new TextDecoder().decode(output.data);
    if (
        new DataView(
            file.data.buffer,
            file.data.byteOffset,
            file.data.byteLength
        ).getInt16(0, true) === -1
    )
        text = text.replace(/^HETRO\s+/, `HETRO ${data.partials},`);
    const exported = formatHetro(parseHetroText(text));
    if (exported !== canonical)
        throw new Error(
            "The converter changed this analysis unexpectedly. The input has not been changed."
        );
    return exported;
}

/** Rebuild only valid current edits; native import silently truncates fractions and bad fields. */
export async function convertHetro(
    request: { text: string; name: string },
    signal: AbortSignal,
    status: (text: string) => void
) {
    const analysis = parseHetroText(request.text);
    const text = formatHetro(analysis);
    const result = await runTool(
        {
            tool: "het_import",
            args: ["input.txt", "output.het"],
            files: [
                // Older het_import builds expect the count without the HETRO label.
                {
                    name: "input.txt",
                    data: new TextEncoder().encode(text.slice(6))
                }
            ],
            output: "output.het"
        },
        signal,
        status
    );
    signal.throwIfAborted();
    if (formatHetro(parseHetroBinary(result.data)) !== text)
        throw new Error("The converter could not preserve this analysis.");
    const stem =
        request.name.replace(/^.*[/\\]/, "").replace(/\.[^.]+$/, "") ||
        "analysis";
    return { name: `${stem}.het`, data: result.data, text, analysis };
}

/** Bound plotting work to one selected partial and at most 1000 points per curve. */
export function partialPlots(data: HetroData, partial: number): [Plot, Plot] {
    return [0, 1].map((kind) => {
        const track = data.tracks[partial * 2 + kind];
        const step = Math.max(1, Math.ceil(track.points.length / 1000));
        const points = track.points
            .filter(
                (_, index) =>
                    index % step === 0 || index === track.points.length - 1
            )
            .map(([time, value]): [number, number] => [time / 1000, value]);
        return {
            kind: "lines",
            label: kind ? "Frequency" : "Amplitude",
            unit: kind ? "Hz" : "level",
            duration: Math.max(data.duration, 0.001),
            max: track.points.reduce(
                (max, [, value]) => Math.max(max, value),
                1
            ),
            series: [points]
        };
    }) as [Plot, Plot];
}
