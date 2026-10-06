// @vitest-environment node
import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";
import { executeTool } from "./wasi";
import { decodeWave, encodeAudio } from "./audio";
import { sweepRequest, impulseRequest } from "./impulse";
import type { ToolRequest } from "./types";

const signal = new AbortController().signal;
async function run(request: ToolRequest) {
    const module = await WebAssembly.compile(
        await readFile(`node_modules/@csound/wasm-bin/lib/${request.tool}.wasm`)
    );
    return executeTool(module, request);
}
it("generates a published mkir sweep and recovers a known mono impulse", async () => {
    const output = await run(sweepRequest({ seconds: 0.128, rate: 8000 }));
    const audio = decodeWave(output.data);
    expect(audio.channels).toHaveLength(1);
    expect(audio.channels[0]).toHaveLength(1024);
    const sweep = { name: "sweep.wav", data: output.data, audio };
    const samples = new Float32Array(1536);
    samples.set(audio.channels[0], 20);
    const recordingAudio = {
        sampleRate: 8000,
        channels: [new Float32Array(1536), samples]
    };
    const recording = {
        name: "recording.wav",
        audio: recordingAudio,
        data: encodeAudio(recordingAudio)
    };
    const result = await run(
        await impulseRequest(
            { kind: "extract", sweep, recording, channel: 1 },
            signal
        )
    );
    const impulse = decodeWave(result.data).channels[0];
    expect(impulse.length).toBe(1024);
    expect(impulse[20]).toBeCloseTo(1, 3);
    expect(impulse.every(Number.isFinite)).toBe(true);
    expect(
        impulse.reduce(
            (sum, value, index) => sum + (index === 20 ? 0 : value * value),
            0
        )
    ).toBeLessThan(0.001);
});
it("generates a default-length sweep and deconvolves it", async () => {
    const output = await run(sweepRequest({ seconds: 1, rate: 48000 }));
    const sweep = {
        name: "sweep.wav",
        data: output.data,
        audio: decodeWave(output.data)
    };
    const result = await run(
        await impulseRequest(
            { kind: "extract", sweep, recording: sweep, channel: 0 },
            signal
        )
    );
    expect(decodeWave(result.data).channels[0][0]).toBeCloseTo(1, 3);
});
it("converts the selected channel and exact range to portable convolve data", async () => {
    const samples = new Float32Array(8000);
    samples[1000] = 0.5;
    const audio = {
        sampleRate: 8000,
        channels: [new Float32Array(8000), samples]
    };
    const source = { name: "ir.wav", audio, data: encodeAudio(audio) };
    const request = await impulseRequest(
        { kind: "convolution", source, range: [0.1, 0.2], channel: 1 },
        signal
    );
    const result = await run(request);
    const text = new TextDecoder().decode(result.data);
    expect(text).toMatch(/^CVANAL\n/);
    expect(text.split("\n")[1]).toContain("800");
    expect(decodeWave(request.files[0].data).channels[0][200]).toBe(0.5);
});
it("rejects invalid sweep settings before execution", () => {
    expect(() => sweepRequest({ seconds: Infinity, rate: 48000 })).toThrow();
    expect(() => sweepRequest({ seconds: 11, rate: 48000 })).toThrow();
    expect(() => sweepRequest({ seconds: 1, rate: 0 })).toThrow();
});

it("rejects incompatible recordings before running mkir", async () => {
    const audio = {
        sampleRate: 8000,
        channels: [new Float32Array(8000).fill(0.1)]
    };
    const sweep = { name: "sweep.wav", audio, data: encodeAudio(audio) };
    const recording = { ...sweep, audio: { ...audio, sampleRate: 16000 } };
    await expect(
        impulseRequest(
            { kind: "extract", sweep, recording, channel: 0 },
            signal
        )
    ).rejects.toThrow("same sample rate");
    await expect(
        impulseRequest(
            {
                kind: "extract",
                sweep: {
                    ...sweep,
                    audio: {
                        ...audio,
                        channels: [audio.channels[0], audio.channels[0]]
                    }
                },
                recording: sweep,
                channel: 0
            },
            signal
        )
    ).rejects.toThrow("mono reference");
    await expect(
        impulseRequest(
            {
                kind: "extract",
                sweep,
                recording: {
                    ...sweep,
                    audio: { ...audio, channels: [new Float32Array(3000)] }
                },
                channel: 0
            },
            signal
        )
    ).rejects.toThrow("between one and two");
    await expect(
        impulseRequest(
            {
                kind: "convolution",
                source: sweep,
                range: [0.5, 0.1],
                channel: 0
            },
            signal
        )
    ).rejects.toThrow();
});
