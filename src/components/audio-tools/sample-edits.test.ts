// @vitest-environment node
import { readFile } from "node:fs/promises";
import { expect, it, vi } from "vitest";
import {
    applySampleEdits,
    editsMatch,
    stageEdit,
    type SampleEdit
} from "./sample-edits";
import { defaultSettings } from "./operations";
import { encodeAudio, durationOf } from "./audio";
import { executeTool } from "./wasi";
import type { ToolRequest } from "./types";

vi.mock("./runner", () => ({
    runTool: async (request: ToolRequest) =>
        executeTool(
            await WebAssembly.compile(
                await readFile(
                    `node_modules/@csound/wasm-bin/lib/${request.tool}.wasm`
                )
            ),
            request
        )
}));

/** Build edits whose inactive settings cannot affect equality or processing. */
const edit = (operation: SampleEdit["operation"]): SampleEdit => ({
    operation,
    settings: { ...defaultSettings, gain: -6, rate: 8000 },
    range: [0.25, 0.75]
});

it("replaces each edit and shows the exact processing order", () => {
    let edits: SampleEdit[] = [];
    for (const operation of [
        "resample",
        "gain",
        "trim",
        "denoise",
        "normalize"
    ] as const)
        edits = stageEdit(edits, edit(operation));
    expect(edits.map((item) => item.operation)).toEqual([
        "denoise",
        "trim",
        "normalize",
        "gain",
        "resample"
    ]);
    const previous = edits;
    const changed = edit("gain");
    changed.settings.gain = -12;
    edits = stageEdit(edits, changed);
    expect(edits).toHaveLength(5);
    expect(
        previous.find((item) => item.operation === "gain")?.settings.gain
    ).toBe(-6);
    changed.settings.gain = 18;
    expect(edits.find((item) => item.operation === "gain")?.settings.gain).toBe(
        -12
    );
});

it("compares audible settings without treating unrelated controls as another change", () => {
    const a = edit("gain"),
        b = edit("gain");
    b.settings.rate = 48000;
    expect(editsMatch([a], [b])).toBe(true);
    b.settings.gain = 3;
    expect(editsMatch([a], [b])).toBe(false);
});

it("rebuilds the same combined result from Original on every apply", async () => {
    const samples = Float32Array.from(
        { length: 16000 },
        (_, index) => 0.25 * Math.sin((index * 2 * Math.PI * 220) / 16000)
    );
    const audio = { sampleRate: 16000, channels: [samples] };
    const original = { audio, data: encodeAudio(audio) };
    const originalBytes = original.data.slice();
    const edits = [
        edit("trim"),
        edit("normalize"),
        edit("gain"),
        edit("resample")
    ];
    const a = await applySampleEdits(
        original,
        edits,
        new AbortController().signal,
        () => {}
    );
    const b = await applySampleEdits(
        original,
        edits,
        new AbortController().signal,
        () => {}
    );
    expect(a.audio.sampleRate).toBe(8000);
    expect(durationOf(a.audio)).toBeCloseTo(0.5, 3);
    expect(Math.max(...a.audio.channels[0])).toBeCloseTo(10 ** (-7 / 20), 2);
    expect(b.audio.channels).toEqual(a.audio.channels);
    expect(original.data).toEqual(originalBytes);
    expect(durationOf(original.audio)).toBe(1);
});
