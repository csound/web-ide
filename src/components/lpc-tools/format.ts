export const MAX_LPC_BYTES = 16 * 1024 * 1024;
const MAX_VALUES = 1_000_000;
const HEADER = "Magic,Poles,ValuesPerFrame,FrameRate,SampleRate,Duration";
const COLUMNS = "ResidualRMS,SourceRMS,Error,PitchHz,FilterData";
export type LpcData = {
    magic: number;
    poles: number;
    width: number;
    rate: number;
    sampleRate: number;
    duration: number;
    extra: Uint8Array;
    values: Float64Array;
};
export const checkLpcSize = (size: number) => {
    if (size > MAX_LPC_BYTES)
        throw new Error("Use an LPC or text file smaller than 16 MB.");
};
function checkCount(count: number) {
    if (count > MAX_VALUES)
        throw new Error("Use a shorter analysis (up to 1,000,000 values).");
}
function metadata(data: LpcData) {
    if (![999, 2399].includes(data.magic))
        throw new Error(
            "Magic must be 999 (coefficients) or 2399 (pole pairs)."
        );
    if (
        !Number.isInteger(data.poles) ||
        data.poles < 1 ||
        data.poles > 5000 ||
        (data.magic === 2399 && data.poles % 2)
    )
        throw new Error(
            "Use 1 to 5000 poles, with an even count for pole pairs."
        );
    const expected = 4 + data.poles * (data.magic === 2399 ? 2 : 1);
    if (data.width !== expected)
        throw new Error(`ValuesPerFrame must be ${expected} for these poles.`);
    if (
        !Number.isFinite(data.sampleRate) ||
        data.sampleRate < 1 ||
        data.sampleRate > 384000 ||
        !Number.isFinite(data.rate) ||
        data.rate <= 0 ||
        !Number.isFinite(1 / data.rate) ||
        data.rate > data.sampleRate
    )
        throw new Error(
            "Use a sample rate from 1 to 384000 Hz and a positive frame rate no greater than it."
        );
    if (!Number.isFinite(data.duration) || data.duration < 0)
        throw new Error(
            "Duration must be a finite, non-negative number of seconds."
        );
    if (data.extra.length > 4056 || data.extra.length % 4)
        throw new Error(
            "HeaderExtraHex must hold 0 to 4056 bytes, in groups of four."
        );
}
function validate(data: LpcData) {
    metadata(data);
    checkCount(data.values.length);
    if (!data.values.length || data.values.length % data.width)
        throw new Error(
            "Include at least one complete frame. Each row must match ValuesPerFrame."
        );
    if (!Number.isFinite(data.values.length / data.width / data.rate))
        throw new Error("FrameRate is too small for this analysis.");
    for (let i = 0; i < data.values.length; i++) {
        const value = data.values[i],
            column = i % data.width;
        if (!Number.isFinite(value))
            throw new Error(
                `Frame ${1 + Math.floor(i / data.width)}: all values must be finite numbers.`
            );
        if (
            (column < 4 || (data.magic === 2399 && column % 2 === 0)) &&
            value < 0
        )
            throw new Error(
                `Frame ${1 + Math.floor(i / data.width)}: RMS, error, pitch and pole magnitudes cannot be negative.`
            );
    }
    return data;
}
const decimal = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
function number(token: string, row: number): number {
    const text = token.trim();
    if (
        text.length > 64 ||
        !decimal.test(text) ||
        !Number.isFinite(Number(text))
    )
        throw new Error(`Row ${row}: use finite numbers without empty fields.`);
    const value = Number(text);
    if (value === 0 && /[1-9]/.test(text.split(/e/i)[0]))
        throw new Error(`Row ${row}: a value is too small for a 64-bit float.`);
    return value;
}
function numbers(line: string, row: number, count: number) {
    const parts = line.split(",", count + 1);
    if (parts.length !== count)
        throw new Error(
            `Row ${row}: expected ${count} comma-separated values.`
        );
    return parts.map((value) => number(value, row));
}
/** The editor CSV stores complete frames and opaque header bytes, unlike native lpc_export. */
export function parseLpcText(source: string): LpcData {
    checkLpcSize(source.length);
    // Bound the encoded file before allocating parsed rows and frame values.
    checkLpcSize(new TextEncoder().encode(source).length);
    const rows = source
        .replace(/^\uFEFF/, "")
        .trim()
        .split(/\r?\n/)
        .map((row) => row.trim());
    if (rows[0] !== "LPC" || rows[1] !== HEADER || rows[4] !== COLUMNS)
        throw new Error(
            "Keep the LPC header and label lines. Open an LPC file or try the example to start."
        );
    const [magic, poles, width, rate, sampleRate, duration] = numbers(
        rows[2],
        3,
        6
    );
    const hex = rows[3].replace(/^HeaderExtraHex,/, "");
    if (
        !rows[3].startsWith("HeaderExtraHex,") ||
        !/^(?:[\da-f]{8}){0,1014}$/i.test(hex)
    )
        throw new Error(
            "Keep HeaderExtraHex followed by a comma and groups of eight hex digits, or leave it empty."
        );
    const extra = Uint8Array.from(hex.match(/../g) || [], (pair) =>
        Number.parseInt(pair, 16)
    );
    const data: LpcData = {
        magic,
        poles,
        width,
        rate,
        sampleRate,
        duration,
        extra,
        values: new Float64Array()
    };
    metadata(data);
    const count = (rows.length - 5) * width;
    checkCount(count);
    data.values = new Float64Array(count);
    for (let row = 5; row < rows.length; row++)
        data.values.set(numbers(rows[row], row + 1, width), (row - 5) * width);
    return validate(data);
}
/** Current Csound WASM stores four uint32 fields and three float64 fields, little-endian. */
export function readLpc(bytes: Uint8Array): LpcData {
    checkLpcSize(bytes.length);
    const bad = () =>
        new Error(
            "Choose a complete headered, little-endian, 64-bit LPC file from Csound. Headerless and 32-bit LPC files are not supported."
        );
    if (bytes.length < 40) throw bad();
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const head = view.getUint32(0, true);
    if (
        head < 40 ||
        head > 4096 ||
        head % 4 ||
        head > bytes.length ||
        (bytes.length - head) % 8
    )
        throw bad();
    const count = (bytes.length - head) / 8;
    checkCount(count);
    const data: LpcData = {
        magic: view.getUint32(4, true),
        poles: view.getUint32(8, true),
        width: view.getUint32(12, true),
        rate: view.getFloat64(16, true),
        sampleRate: view.getFloat64(24, true),
        duration: view.getFloat64(32, true),
        extra: bytes.slice(40, head),
        values: new Float64Array(count)
    };
    metadata(data);
    for (let i = 0; i < count; i++)
        data.values[i] = view.getFloat64(head + i * 8, true);
    return validate(data);
}
export function writeLpc(data: LpcData): Uint8Array {
    validate(data);
    const head = 40 + data.extra.length;
    checkLpcSize(head + data.values.length * 8);
    const bytes = new Uint8Array(head + data.values.length * 8),
        view = new DataView(bytes.buffer);
    [head, data.magic, data.poles, data.width].forEach((n, i) =>
        view.setUint32(i * 4, n, true)
    );
    [data.rate, data.sampleRate, data.duration].forEach((n, i) =>
        view.setFloat64(16 + i * 8, n, true)
    );
    bytes.set(data.extra, 40);
    data.values.forEach((n, i) => view.setFloat64(head + i * 8, n, true));
    return bytes;
}
const floatText = (n: number) => (Object.is(n, -0) ? "-0" : String(n));
export function formatLpc(data: LpcData): string {
    const rows = [
        "LPC",
        HEADER,
        [
            data.magic,
            data.poles,
            data.width,
            data.rate,
            data.sampleRate,
            data.duration
        ]
            .map(floatText)
            .join(","),
        "HeaderExtraHex," +
            Array.from(data.extra, (n) => n.toString(16).padStart(2, "0")).join(
                ""
            ),
        COLUMNS
    ];
    let size = rows.reduce((total, row) => total + row.length + 1, 0);
    for (let i = 0; i < data.values.length; i += data.width) {
        const row = Array.from(
            data.values.subarray(i, i + data.width),
            floatText
        ).join(",");
        size += row.length + 1;
        checkLpcSize(size);
        rows.push(row);
    }
    return rows.join("\n") + "\n";
}
export function dimensions(data: LpcData) {
    const frames = data.values.length / data.width;
    return { frames, duration: (frames - 1) / data.rate };
}
export const exampleText = formatLpc({
    magic: 999,
    poles: 2,
    width: 6,
    rate: 100,
    sampleRate: 8000,
    duration: 0.64,
    extra: new Uint8Array(),
    values: Float64Array.from({ length: 64 * 6 }, (_, i) => {
        const frame = Math.floor(i / 6);
        return [
            0.012,
            0.14,
            0.007,
            180 + 35 * Math.sin(frame / 12),
            -0.9025,
            1.9 * Math.cos((2 * Math.PI * (600 + frame * 4)) / 8000)
        ][i % 6];
    })
});
