import { decodeAudio, durationOf, encodeAudioAsync } from "./audio";
import {
    makeRequest,
    sampleOperations,
    type SampleOperation,
    type Settings
} from "./operations";
import { runTool } from "./runner";
import type { AudioData } from "./types";

export type SampleEdit = {
    operation: SampleOperation;
    settings: Settings;
    range: [number, number];
};
// Noise ranges refer to Original. Trim next; set the peak before applying gain,
// then resample once at the end. The UI shows this exact order.
const order: SampleOperation[] = [
    "denoise",
    "trim",
    "normalize",
    "gain",
    "resample"
];

/** Compare only parameters that affect audio, ignoring other controls in each snapshot. */
export function editsMatch(a: SampleEdit[], b: SampleEdit[]) {
    const key = (edits: SampleEdit[]) =>
        JSON.stringify(
            edits.map(({ operation, settings, range }) => [
                operation,
                {
                    trim: range,
                    gain: settings.gain,
                    normalize: settings.peak,
                    resample: settings.rate,
                    denoise: [settings.reduction, ...range]
                }[operation]
            ])
        );
    return key(a) === key(b);
}

/** Replace a pending edit without adding another application of the same effect. */
export function stageEdit(edits: SampleEdit[], edit: SampleEdit): SampleEdit[] {
    return [
        ...edits.filter((item) => item.operation !== edit.operation),
        {
            operation: edit.operation,
            settings: { ...edit.settings },
            range: [...edit.range] as [number, number]
        }
    ].sort((a, b) => order.indexOf(a.operation) - order.indexOf(b.operation));
}

/** Describe the exact parameters stored with a pending or applied edit. */
export function describeEdit(edit: SampleEdit) {
    const { operation, settings, range } = edit;
    const seconds = (value: number) => `${Number(value.toFixed(3))} s`;
    const detail: Record<SampleOperation, string> = {
        trim: `Keep ${seconds(range[0])} to ${seconds(range[1])}`,
        gain: `${settings.gain > 0 ? "+" : ""}${settings.gain} dB`,
        normalize: `Peak ${settings.peak} dB`,
        resample: `${settings.rate.toLocaleString()} Hz`,
        denoise: `${settings.reduction} dB · Noise from ${seconds(range[0])} to ${seconds(range[1])}`
    };
    return {
        label: sampleOperations.find((item) => item.id === operation)!.label,
        detail: detail[operation]
    };
}

/** Rebuild from Original on every apply, preserving a snapshot of the audible edits. */
export async function applySampleEdits(
    original: { audio: AudioData; data: Uint8Array },
    edits: SampleEdit[],
    signal: AbortSignal,
    status: (text: string) => void
) {
    if (!edits.length) throw new Error("Choose at least one edit.");
    let { audio, data } = original;
    for (const edit of edits) {
        signal.throwIfAborted();
        const { label } = describeEdit(edit);
        status(`Applying ${label.toLowerCase()}…`);
        if (edit.operation === "trim") {
            data = await encodeAudioAsync(audio, signal, edit.range);
        } else {
            const range: [number, number] =
                edit.operation === "denoise"
                    ? edit.range
                    : [0, durationOf(audio)];
            const output = await runTool(
                makeRequest(
                    edit.operation,
                    edit.settings,
                    data,
                    range,
                    durationOf(audio)
                ),
                signal,
                (text) => status(`${label}: ${text}`)
            );
            data = output.data;
        }
        audio = await decodeAudio(data, signal);
    }
    signal.throwIfAborted();
    return { audio, data };
}
