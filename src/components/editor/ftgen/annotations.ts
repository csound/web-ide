import type { TableRequest } from "./source";
export type PlotGuide = {
    name: string;
    detail: string;
    label: string;
    points: number[];
    harmonics: { partial: number; amplitude: number }[];
    domain?: [number, number];
};

export function plotGuide(request: TableRequest, length: number): PlotGuide {
    const { fields: p, gen } = request.tables.at(-1)!;
    const routine = Math.abs(p[3]),
        args = p.slice(4);
    const guide: PlotGuide = {
        name: gen || `GEN${String(routine).padStart(2, "0")}`,
        detail: "Function table",
        label: "Sample index",
        points: [],
        harmonics: []
    };
    if ([5, 6, 7, 8, 16].includes(routine)) {
        guide.detail = {
            5: "Exponential segments",
            6: "Cubic polynomial segments",
            7: "Linear segments",
            8: "Cubic spline",
            16: "Curved segments"
        }[routine]!;
        guide.points = [0];
        for (let i = 1, x = 0; i < args.length; i += routine === 16 ? 3 : 2) {
            x += args[i];
            if (x >= 0 && x <= length) guide.points.push(x);
        }
    } else if ([25, 27].includes(routine)) {
        guide.detail =
            routine === 25 ? "Exponential breakpoints" : "Linear breakpoints";
        guide.points = args.filter(
            (_, i) => i % 2 === 0 && args[i] >= 0 && args[i] <= length
        );
    } else if ([9, 10, 11, 19].includes(routine)) {
        guide.detail = "Additive waveform";
        guide.label = "Cycle position";
        guide.domain = [0, 1];
        if (routine === 10)
            guide.harmonics = args.map((amplitude, i) => ({
                partial: i + 1,
                amplitude
            }));
        if (routine === 9 || routine === 19)
            for (let i = 0; i + 1 < args.length; i += routine === 9 ? 3 : 4)
                guide.harmonics.push({
                    partial: args[i],
                    amplitude: args[i + 1]
                });
    } else if (routine === 20) {
        const names = [
            "",
            "Hamming",
            "Hann",
            "Bartlett",
            "Blackman",
            "Blackman–Harris",
            "Gaussian",
            "Kaiser",
            "Rectangle",
            "Sinc"
        ];
        guide.detail = `${names[args[0]] || "Custom"} window`;
        guide.label = "Window position";
        guide.domain = [0, 1];
        guide.points = [length / 2];
    } else if (routine === 3 || ["tanh", "exp", "sone"].includes(gen || "")) {
        guide.detail =
            routine === 3
                ? "Polynomial transfer function"
                : "Transfer function";
        guide.label = "Input";
        guide.domain = [args[0], args[1]];
    } else if ([13, 14, 15].includes(routine))
        guide.detail = "Chebyshev waveshaping";
    else if (routine === 21)
        guide.detail = "Random distribution · fixed preview seed";
    else if ([40, 41, 42].includes(routine))
        guide.detail = "Probability distribution";
    else if ([2, 17].includes(routine))
        guide.detail = routine === 2 ? "Explicit values" : "Stepped values";
    else if (routine === 51) {
        guide.detail = "Tuning frequencies";
        guide.label = "Key number";
    } else if (routine === 53) guide.detail = "Impulse response";
    else if ([30, 31, 32, 33, 34].includes(routine))
        guide.detail = "Spectral composition";
    else if ([4, 24].includes(routine)) guide.detail = "Rescaled source table";
    else if (gen === "quadbezier") guide.detail = "Quadratic Bézier segments";
    return guide;
}

/** Keep extrema in each pixel bucket; don't hide narrow spikes in large tables. */
export function plotIndices(samples: Float64Array, width: number): number[] {
    const stride = Math.max(1, Math.ceil(samples.length / Math.max(1, width)));
    const indices: number[] = [];
    for (let start = 0; start < samples.length; start += stride) {
        const end = Math.min(start + stride, samples.length);
        let low = start,
            high = start;
        for (let i = start + 1; i < end; i++) {
            if (samples[i] < samples[low]) low = i;
            if (samples[i] > samples[high]) high = i;
        }
        for (const i of [...new Set([start, low, high, end - 1])].sort(
            (a, b) => a - b
        ))
            indices.push(i);
    }
    return indices;
}
