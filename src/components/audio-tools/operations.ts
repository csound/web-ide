import type { ToolName, ToolRequest } from "./types";
import { readWave } from "../csound/wave-files";
import { checkAudioLayout } from "./limits";

export type SampleOperation =
    "trim" | "gain" | "normalize" | "resample" | "denoise";
export type AnalysisOperation =
    "spectrum" | "partials" | "harmonics" | "lpc" | "envelope";
export type Operation = SampleOperation | AnalysisOperation;
export type WasmOperation = Exclude<Operation, "trim">;
export const sampleOperations: {
    id: SampleOperation;
    label: string;
    hint: string;
}[] = [
    {
        id: "trim",
        label: "Trim",
        hint: "Drag across the waveform to choose the part to keep."
    },
    { id: "gain", label: "Gain", hint: "Adjust the level of the whole file." },
    {
        id: "normalize",
        label: "Normalize",
        hint: "Set the peak level while keeping the dynamics."
    },
    {
        id: "resample",
        label: "Resample",
        hint: "Change the sample rate of the whole file."
    },
    {
        id: "denoise",
        label: "Reduce noise",
        hint: "Select a noise-only range. Use at least 0.1 seconds."
    }
];
export const analysisOperations: {
    id: AnalysisOperation;
    label: string;
    hint: string;
}[] = [
    {
        id: "spectrum",
        label: "Spectrum",
        hint: "See how frequencies change over time. Save a PVOC-EX file for spectral processing."
    },
    {
        id: "partials",
        label: "Partials",
        hint: "Track individual tones. Save an ATS file for resynthesis."
    },
    {
        id: "harmonics",
        label: "Harmonics",
        hint: "Track harmonics of a known note. Save a HETRO file for adsyn."
    },
    {
        id: "lpc",
        label: "Voice",
        hint: "Analyze speech and pitch. Save LPC data for voice and formant effects."
    },
    {
        id: "envelope",
        label: "Envelope",
        hint: "Trace changes in level. Save time and amplitude points as text."
    }
];
export type Settings = {
    gain: number;
    peak: number;
    rate: number;
    reduction: number;
    fft: number;
    fundamental: number;
    harmonics: number;
    poles: number;
    window: number;
};
export const defaultSettings: Settings = {
    gain: 0,
    peak: -1,
    rate: 44100,
    reduction: 20,
    fft: 2048,
    fundamental: 220,
    harmonics: 12,
    poles: 34,
    window: 0.02
};
const definitions: Record<
    WasmOperation,
    { tool: ToolName; extension: string }
> = {
    gain: { tool: "scale", extension: "wav" },
    normalize: { tool: "scale", extension: "wav" },
    resample: { tool: "src_conv", extension: "wav" },
    denoise: { tool: "dnoise", extension: "wav" },
    spectrum: { tool: "pvanal", extension: "pvx" },
    partials: { tool: "atsa", extension: "ats" },
    harmonics: { tool: "hetro", extension: "het" },
    lpc: { tool: "lpanal", extension: "lpc" },
    envelope: { tool: "envext", extension: "txt" }
};

/** Validate active controls and build a Csound request with fixed in-memory filenames. */
export function makeRequest(
    operation: WasmOperation,
    settings: Settings,
    input: Uint8Array,
    range: [number, number],
    duration: number
): ToolRequest {
    if (!Number.isFinite(duration) || duration <= 0)
        throw new Error("Choose an audio file with sound data.");
    const fields: Record<WasmOperation, (keyof Settings)[]> = {
        gain: ["gain"],
        normalize: ["peak"],
        resample: ["rate"],
        denoise: ["reduction"],
        spectrum: ["fft"],
        partials: [],
        harmonics: ["fundamental", "harmonics"],
        lpc: ["poles"],
        envelope: ["window"]
    };
    const activeFields = fields[operation];
    if (activeFields.some((key) => !Number.isFinite(settings[key])))
        throw new Error("Enter a number for each setting.");
    const bounds: [keyof Settings, number, number][] = [
        ["gain", -36, 18],
        ["peak", -24, 0],
        ["rate", 8000, 96000],
        ["reduction", 6, 60],
        ["fft", 512, 8192],
        ["fundamental", 20, 4000],
        ["harmonics", 1, 32],
        ["poles", 4, 60],
        ["window", 0.005, 1]
    ];
    if (
        bounds.some(
            ([key, min, max]) =>
                activeFields.includes(key) &&
                (settings[key] < min || settings[key] > max)
        )
    )
        throw new Error("A setting is outside its allowed range.");
    if (
        activeFields.some(
            (key) =>
                ["rate", "fft", "harmonics", "poles"].includes(key) &&
                !Number.isInteger(settings[key])
        )
    )
        throw new Error(
            "Use whole numbers for sample rate, frequency detail, harmonics, and poles."
        );
    const { tool, extension } = definitions[operation];
    if (operation === "resample") {
        const wave = readWave(input);
        // Reject oversized output before downloading or running the resampler.
        checkAudioLayout(
            Math.ceil((wave.frames * settings.rate) / wave.sampleRate),
            wave.channels
        );
    }
    const output = `result.${extension}`;
    const args: Record<WasmOperation, string[]> = {
        gain: [
            "-W",
            "-f",
            `-F${10 ** (settings.gain / 20)}`,
            `-o${output}`,
            "input.wav"
        ],
        normalize: [
            "-W",
            "-f",
            `-P${100 * 10 ** (settings.peak / 20)}`,
            `-o${output}`,
            "input.wav"
        ],
        resample: [`-r${settings.rate}`, `-o${output}`, "input.wav"],
        denoise: [
            "-W",
            "-iinput.wav",
            `-b${range[0]}`,
            `-e${range[1]}`,
            `-m${-settings.reduction}`,
            `-o${output}`,
            "input.wav"
        ],
        spectrum: [`-n${settings.fft}`, "-w4", "input.wav", output],
        partials: ["input.wav", output, "-F1"],
        harmonics: [
            "-X",
            `-f${settings.fundamental}`,
            `-h${settings.harmonics}`,
            "-n256",
            "input.wav",
            output
        ],
        lpc: [`-p${settings.poles}`, "input.wav", output],
        envelope: [`-w${settings.window}`, `-o${output}`, "input.wav"]
    };
    if (
        range.some((value) => !Number.isFinite(value)) ||
        range[0] < 0 ||
        range[1] > duration + 0.001 ||
        range[1] <= range[0]
    )
        throw new Error("Choose a valid audio range.");
    if (operation === "denoise" && range[1] - range[0] < 0.1)
        throw new Error("Select at least 0.1 seconds of noise.");
    if (operation === "harmonics" && duration > 30)
        throw new Error(
            "Harmonic analysis supports up to 30 seconds. Trim a shorter sample first."
        );
    return {
        tool,
        args: args[operation],
        files: [{ name: "input.wav", data: input }],
        output
    };
}

/** Name a new result after its source, operation, and output format. */
export function resultFilename(source: string, operation: Operation): string {
    return `${source.replace(/\.[^.]+$/, "")}-${operation}.${operation === "trim" ? "wav" : definitions[operation].extension}`;
}
