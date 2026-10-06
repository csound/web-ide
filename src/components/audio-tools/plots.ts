import type { AnalysisOperation } from "./operations";
import type { Plot, ToolRequest } from "./types";

/** Read PVOC-EX frame dimensions and reject missing or truncated chunks. */
function pvxLayout(bytes: Uint8Array) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const text = new TextDecoder();
    let format = 0,
        data = 0,
        size = 0;
    for (let offset = 12; offset + 8 <= bytes.length; ) {
        const length = view.getUint32(offset + 4, true);
        if (offset + 8 + length > bytes.length)
            throw new Error("Incomplete analysis file.");
        const name = text.decode(bytes.subarray(offset, offset + 4));
        if (name === "fmt " && length >= 80) format = offset + 8;
        if (name === "data") {
            data = offset + 8;
            size = length;
        }
        offset += 8 + length + (length % 2);
    }
    if (!format || !data)
        throw new Error("Unsupported spectral analysis format.");
    const bins = view.getUint32(format + 56, true);
    const rate = view.getFloat32(format + 72, true);
    const channels = view.getUint16(format + 2, true);
    const sampleRate = view.getUint32(format + 4, true);
    const frames = Math.floor(size / (bins * 8 * channels));
    if (!bins || !frames || !Number.isFinite(rate) || rate <= 0)
        throw new Error("Empty spectral analysis.");
    return { view, bins, rate, channels, sampleRate, frames, data };
}

/** Select one PVOC-EX frame for the optional, separately loaded bin inspector. */
export function inspectFrame(bytes: Uint8Array, seconds: number): ToolRequest {
    const { rate, frames } = pvxLayout(bytes);
    const frame = Math.max(1, Math.min(frames, Math.round(seconds * rate) + 1));
    return {
        tool: "pvlook",
        args: ["-bf", String(frame), "-ef", String(frame), "input.pvx"],
        files: [{ name: "input.pvx", data: bytes }],
        output: "stdout"
    };
}

/** Convert pvlook frequency/amplitude pairs into a sorted spectrum plot. */
export function binPlot(bytes: Uint8Array, sampleRate: number): Plot {
    const text = new TextDecoder().decode(bytes);
    const points: [number, number][] = [];
    for (const match of text.matchAll(
        /Bin \d+ Freqs\.\s+([\d.eE+-]+)\s+Bin \d+ Amps\.\s+([\d.eE+-]+)/g
    )) {
        const frequency = Number(match[1]),
            amplitude = Number(match[2]);
        if (Number.isFinite(frequency) && Number.isFinite(amplitude))
            points.push([Math.max(0, frequency), Math.max(0, amplitude)]);
    }
    if (!points.length) throw new Error("No frequency bins in this frame.");
    points.sort((a, b) => a[0] - b[0]);
    return {
        kind: "lines",
        label: "Frequency bins",
        unit: "amplitude",
        xUnit: "Hz",
        duration: sampleRate / 2,
        max: Math.max(0.001, ...points.map((point) => point[1])),
        series: [points]
    };
}

/** Read Csound analysis output into bounded plot data; throw for unsupported or incomplete files. */
export function analysisPlot(
    operation: AnalysisOperation,
    bytes: Uint8Array,
    duration: number
): Plot {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (operation === "spectrum") {
        const { bins, channels, sampleRate, frames, rate, data } =
            pvxLayout(bytes);
        // PVOC-EX can contain padded frames after the source ends. Keep the
        // time axis aligned with the waveform and the frame inspector.
        const usedFrames = Math.max(
            1,
            Math.min(frames, Math.ceil(duration * rate))
        );
        const width = Math.min(320, usedFrames),
            height = Math.min(160, bins);
        const values = new Float32Array(width * height);
        for (let x = 0; x < width; x++) {
            const frame = Math.min(
                frames - 1,
                Math.floor((x * duration * rate) / width)
            );
            for (let y = 0; y < height; y++) {
                let amplitude = 0;
                const end = Math.max(1, Math.floor(((y + 1) * bins) / height));
                for (
                    let bin = Math.floor((y * bins) / height);
                    bin < end;
                    bin++
                ) {
                    amplitude = Math.max(
                        amplitude,
                        view.getFloat32(
                            data + (frame * bins * channels + bin) * 8,
                            true
                        )
                    );
                }
                values[y * width + x] = Math.max(
                    0,
                    Math.min(
                        1,
                        (20 * Math.log10(Math.max(1e-5, amplitude)) + 100) / 100
                    )
                );
            }
        }
        return {
            kind: "heatmap",
            label: "Spectral energy",
            unit: "Hz",
            duration,
            max: sampleRate / 2,
            width,
            height,
            values
        };
    }
    let series: [number, number][][] = [];
    let label = "",
        unit = "Hz";
    if (operation === "partials") {
        if (bytes.length < 80 || view.getFloat64(0, true) !== 123)
            throw new Error("Unsupported ATS file.");
        const partials = view.getFloat64(32, true),
            frames = view.getFloat64(40, true);
        const type = view.getFloat64(72, true);
        if (
            type !== 1 ||
            !Number.isInteger(partials) ||
            partials < 1 ||
            !Number.isInteger(frames) ||
            frames < 1 ||
            80 + frames * (1 + partials * 2) * 8 > bytes.length
        )
            throw new Error("Incomplete ATS file.");
        series = Array.from({ length: Math.min(32, partials) }, () => []);
        for (
            let frame = 0;
            frame < frames;
            frame += Math.max(1, Math.ceil(frames / 600))
        ) {
            const offset = 80 + frame * (1 + partials * 2) * 8;
            const time = view.getFloat64(offset, true);
            series.forEach((points, partial) => {
                const amplitude = view.getFloat64(
                    offset + 8 + partial * 16,
                    true
                );
                points.push([
                    time,
                    amplitude > 1e-5
                        ? view.getFloat64(offset + 16 + partial * 16, true)
                        : Number.NaN
                ]);
            });
        }
        label = "Partial frequencies (up to 32 tracks)";
    } else if (operation === "harmonics") {
        series = new TextDecoder()
            .decode(bytes)
            .split(/\r?\n/)
            .filter((line) => line.startsWith("-2,"))
            .map((line) => {
                const values = line.split(",").map(Number);
                const points: [number, number][] = [];
                for (let index = 1; index + 1 < values.length; index += 2)
                    points.push([values[index] / 1000, values[index + 1]]);
                return points;
            });
        label = "Harmonic frequencies";
    } else if (operation === "lpc") {
        if (bytes.length < 40 || view.getUint32(4, true) !== 999)
            throw new Error("Unsupported LPC file.");
        const start = view.getUint32(0, true),
            values = view.getUint32(12, true);
        const rate = view.getFloat64(16, true);
        const frames = Math.floor((bytes.length - start) / (values * 8));
        if (!Number.isFinite(rate) || rate <= 0 || values < 4 || !frames)
            throw new Error("Empty LPC analysis.");
        const points: [number, number][] = [];
        for (
            let frame = 0;
            frame < frames;
            frame += Math.max(1, Math.ceil(frames / 1000))
        )
            points.push([
                frame / rate,
                view.getFloat64(start + (frame * values + 3) * 8, true)
            ]);
        series = [points];
        label = "LPC pitch estimate";
    } else {
        series = [
            new TextDecoder()
                .decode(bytes)
                .trim()
                .split(/\r?\n/)
                .map((line): [number, number] => {
                    const [time, amplitude] = line
                        .trim()
                        .split(/\s+/)
                        .map(Number);
                    return [time, Math.abs(amplitude)];
                })
        ];
        label = "Amplitude envelope";
        unit = "amplitude";
    }
    const values = series
        .flat()
        .map((point) => point[1])
        .filter(Number.isFinite);
    if (!values.length) throw new Error("No values to plot in this analysis.");
    return {
        kind: "lines",
        label,
        unit,
        duration,
        max: values.reduce((max, value) => Math.max(max, value), 0.001),
        series
    };
}
