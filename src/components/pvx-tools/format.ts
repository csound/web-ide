import type { Plot } from "../audio-tools/types";

export const MAX_PVX_BYTES = 16 * 1024 * 1024;
const MAX_VALUES = 1_000_000;
export const WAVE_HEADER =
    "FormatTag,Channels,SamplesPerSec,AvgBytesPerSec,BlockAlign,BitsPerSample,cbSize";
export const PV_HEADER =
    "WordFormat,AnalFormat,SourceFormat,WindowType,AnalysisBins,Winlen,Overlap,FrameAlign,AnalysisRate,WindowParam";
const GUID = [
    0xc2, 0xb9, 0x12, 0x83, 0x6e, 0x2e, 0xd4, 0x11, 0xa8, 0x24, 0xde, 0x5b,
    0x96, 0xc3, 0xab, 0x21
];
export type PvxData = { wave: number[]; pv: number[]; values: Float32Array };
export const checkPvxSize = (size: number) => {
    if (size > MAX_PVX_BYTES)
        throw new Error("Use a PVX or text file smaller than 16 MB.");
};
function checkValues(count: number) {
    if (count > MAX_VALUES)
        throw new Error(
            "This analysis has too many values to edit here. Use a shorter analysis (up to 1,000,000 values)."
        );
}
function integer(value: number, min: number, max: number, label: string) {
    if (!Number.isInteger(value) || value < min || value > max)
        throw new Error(
            `${label} must be a whole number from ${min} to ${max}.`
        );
}
function equal(actual: number, expected: number, label: string) {
    if (actual !== expected)
        throw new Error(`${label} must be ${expected} for these settings.`);
}
function metadata(wave: number[], pv: number[]) {
    if (wave.length !== 7 || pv.length !== 10)
        throw new Error(
            "Keep all seven source fields and all ten analysis fields in the header."
        );
    equal(wave[0], 65534, "FormatTag");
    integer(wave[1], 1, 8, "Channels");
    integer(wave[2], 1, 384000, "SamplesPerSec");
    if (![16, 24, 32].includes(wave[5]))
        throw new Error("BitsPerSample must be 16, 24, or 32.");
    equal(wave[4], (wave[1] * wave[5]) / 8, "BlockAlign");
    equal(wave[3], wave[2] * wave[4], "AvgBytesPerSec");
    equal(wave[6], 62, "cbSize");
    equal(pv[0], 0, "WordFormat (32-bit float)");
    integer(pv[1], 0, 2, "AnalFormat");
    if (![1, 3].includes(pv[2]) || (pv[2] === 3 && wave[5] !== 32))
        throw new Error("SourceFormat must be 1 (PCM) or 3 (32-bit float).");
    integer(
        pv[3],
        0,
        3,
        "WindowType (custom windows cannot be stored as this text format)"
    );
    integer(pv[4], 2, 65537, "AnalysisBins");
    integer(pv[5], 1, 1048576, "Winlen");
    integer(pv[6], 1, (pv[4] - 1) * 2, "Overlap (hop in samples)");
    equal(pv[7], pv[4] * 8, "FrameAlign");
    const rate = Math.fround(wave[2] / pv[6]);
    // Native pv_export writes six significant digits. Accept that rounding,
    // then restore the rate implied by the sample rate and hop.
    if (!Number.isFinite(pv[8]) || Math.abs(pv[8] - rate) > rate * 0.00001)
        throw new Error(
            `AnalysisRate must match SamplesPerSec / Overlap (${rate}).`
        );
    pv[8] = rate;
    if (!Number.isFinite(Math.fround(pv[9])) || pv[9] < 0)
        throw new Error("WindowParam must be a finite non-negative float.");
    if (pv[3] !== 2) equal(pv[9], 0, "WindowParam for this window");
    pv[9] = Math.fround(pv[9]);
}
function validate(data: PvxData) {
    metadata(data.wave, data.pv);
    const { values, pv, wave } = data;
    checkValues(values.length);
    if (!values.length || values.length % (pv[4] * 2 * wave[1]))
        throw new Error(
            "Include one complete row per channel for every frame."
        );
    for (let index = 0; index < values.length; index++) {
        if (!Number.isFinite(values[index]))
            throw new Error(
                `Row ${5 + Math.floor(index / (pv[4] * 2))}: values must be finite 32-bit floats.`
            );
        if (pv[1] !== 2 && index % 2 === 0 && values[index] < 0)
            throw new Error(
                `Row ${5 + Math.floor(index / (pv[4] * 2))}: amplitudes cannot be negative.`
            );
    }
    return data;
}
const numeric = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
function numbers(line: string, row: number, count: number) {
    const tokens = line.split(",", count + 1);
    if (tokens.length !== count)
        throw new Error(
            `Row ${row}: expected ${count} comma-separated values.`
        );
    return tokens.map((token) => {
        const text = token.trim();
        if (
            text.length > 64 ||
            !numeric.test(text) ||
            !Number.isFinite(Number(text))
        )
            throw new Error(
                `Row ${row}: use comma-separated numbers without empty fields.`
            );
        return Number(text);
    });
}
/** Parse converter CSV, checking every row before the permissive native importer. */
export function parsePvxText(source: string): PvxData {
    checkPvxSize(source.length);
    const lines = source
        .replace(/^\uFEFF/, "")
        .trim()
        .split(/\r?\n/)
        .map((line) => line.trim());
    if (lines[0] !== WAVE_HEADER || lines[2] !== PV_HEADER)
        throw new Error(
            "Keep the two PVX header labels. Open a PVX file or try the example to start."
        );
    if (lines.length < 5)
        throw new Error(
            "Include the four header lines and at least one complete frame."
        );
    const wave = numbers(lines[1], 2, 7),
        pv = numbers(lines[3], 4, 10);
    metadata(wave, pv);
    const columns = pv[4] * 2;
    checkValues(Math.max(0, lines.length - 4) * columns);
    const values = new Float32Array(Math.max(0, lines.length - 4) * columns);
    for (let row = 4; row < lines.length; row++) {
        const cells = numbers(lines[row], row + 1, columns);
        for (let col = 0; col < columns; col++) {
            const rounded = Math.fround(cells[col]);
            if (
                !Number.isFinite(rounded) ||
                (cells[col] !== 0 && rounded === 0)
            )
                throw new Error(
                    `Row ${row + 1}: a value is outside the 32-bit float range.`
                );
            values[(row - 4) * columns + col] = rounded;
        }
    }
    return validate({ wave, pv, values });
}
/** Validate RIFF boundaries and PVOC-EX dimensions before invoking native code. */
export function readPvx(bytes: Uint8Array): {
    analysis: PvxData;
    fmtOffset: number;
    dataOffset: number;
} {
    checkPvxSize(bytes.length);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const tag = (offset: number) =>
        String.fromCharCode(...bytes.subarray(offset, offset + 4));
    const invalid = () =>
        new Error(
            "Choose a complete 32-bit PVOC-EX .pvx file, rather than audio or legacy .pv analysis."
        );
    if (
        bytes.length < 12 ||
        tag(0) !== "RIFF" ||
        tag(8) !== "WAVE" ||
        view.getUint32(4, true) + 8 !== bytes.length
    )
        throw invalid();
    let fmtOffset = -1,
        dataOffset = -1,
        dataSize = 0;
    for (let offset = 12; offset < bytes.length; ) {
        if (offset + 8 > bytes.length) throw invalid();
        const size = view.getUint32(offset + 4, true),
            start = offset + 8;
        const end = start + size + (size % 2);
        if (end > bytes.length) throw invalid();
        if (tag(offset) === "fmt ") {
            if (fmtOffset !== -1 || size !== 80) throw invalid();
            fmtOffset = start;
        } else if (tag(offset) === "data") {
            if (dataOffset !== -1 || fmtOffset === -1 || size % 4)
                throw invalid();
            dataOffset = start;
            dataSize = size;
        } else if (tag(offset) === "PVXW")
            throw new Error(
                "Custom-window PVX files cannot round-trip through the converter text format."
            );
        offset = end;
    }
    if (fmtOffset < 0 || dataOffset < 0) throw invalid();
    const f = fmtOffset;
    if (
        GUID.some((byte, index) => bytes[f + 24 + index] !== byte) ||
        view.getUint32(f + 40, true) !== 1 ||
        view.getUint32(f + 44, true) !== 32
    )
        throw invalid();
    const wave = [
        view.getUint16(f, true),
        view.getUint16(f + 2, true),
        view.getUint32(f + 4, true),
        view.getUint32(f + 8, true),
        view.getUint16(f + 12, true),
        view.getUint16(f + 14, true),
        view.getUint16(f + 16, true)
    ];
    const pv = [
        view.getUint16(f + 48, true),
        view.getUint16(f + 50, true),
        view.getUint16(f + 52, true),
        view.getUint16(f + 54, true),
        view.getUint32(f + 56, true),
        view.getUint32(f + 60, true),
        view.getUint32(f + 64, true),
        view.getUint32(f + 68, true),
        view.getFloat32(f + 72, true),
        view.getFloat32(f + 76, true)
    ];
    metadata(wave, pv);
    if (
        view.getUint32(f + 20, true) !== 0 ||
        view.getUint16(f + 18, true) !== wave[5]
    )
        throw new Error(
            "This file has channel-mask or valid-bit metadata that the converter text cannot preserve."
        );
    checkValues(dataSize / 4);
    const values = new Float32Array(dataSize / 4);
    for (let i = 0; i < values.length; i++)
        values[i] = view.getFloat32(dataOffset + i * 4, true);
    return { analysis: validate({ wave, pv, values }), fmtOffset, dataOffset };
}
const floatText = (value: number) =>
    Object.is(value, -0) ? "-0" : String(Number(value.toPrecision(9)));
/** Nine significant digits round-trip every finite float32, unlike native export's six. */
export function formatPvx(data: PvxData) {
    const rows = [
        WAVE_HEADER,
        data.wave.join(","),
        PV_HEADER,
        data.pv.map(floatText).join(",")
    ];
    let length = rows.reduce((sum, row) => sum + row.length + 1, 0);
    const columns = data.pv[4] * 2;
    for (let offset = 0; offset < data.values.length; offset += columns) {
        const row = Array.from(
            data.values.subarray(offset, offset + columns),
            floatText
        ).join(",");
        length += row.length + 1;
        checkPvxSize(length);
        rows.push(row);
    }
    return rows.join("\n") + "\n";
}
export function dimensions(data: PvxData) {
    const frames = data.values.length / (data.pv[4] * 2 * data.wave[1]);
    return {
        frames,
        channels: data.wave[1],
        bins: data.pv[4],
        sampleRate: data.wave[2],
        hop: data.pv[6],
        duration: ((frames - 1) * data.pv[6]) / data.wave[2]
    };
}
export function spectrum(data: PvxData, frame: number, channel: number): Plot {
    const { bins, channels, sampleRate } = dimensions(data);
    const offset = (frame * channels + channel) * bins * 2;
    const series: [number, number][] = [];
    let max = 0;
    // Keep narrow peaks when reducing a large FFT for the plot.
    const step = Math.max(1, Math.ceil(bins / 1024));
    for (let bin = 0; bin < bins; bin += step) {
        let value = 0;
        for (let j = bin; j < Math.min(bins, bin + step); j++) {
            const a = data.values[offset + j * 2],
                b = data.values[offset + j * 2 + 1];
            value = Math.max(value, data.pv[1] === 2 ? Math.hypot(a, b) : a);
        }
        max = Math.max(max, value);
        series.push([((bin / (bins - 1)) * sampleRate) / 2, value]);
    }
    return {
        kind: "lines",
        label: "Frame spectrum",
        unit: "magnitude",
        duration: sampleRate / 2,
        xUnit: "Hz",
        max: max || 1,
        series: [series]
    };
}
export const exampleText = formatPvx({
    wave: [65534, 1, 8000, 16000, 2, 16, 62],
    pv: [0, 0, 1, 1, 33, 64, 64, 264, 125, 0],
    values: Float32Array.from({ length: 64 * 33 * 2 }, (_, index) => {
        const bin = Math.floor(index / 2) % 33,
            frame = Math.floor(index / 66);
        return index % 2
            ? bin * 125
            : Math.exp(-((bin - 3 - frame / 32) ** 2) / 2) *
                  (0.2 + 0.6 * Math.sin((frame / 63) * Math.PI));
    })
});
