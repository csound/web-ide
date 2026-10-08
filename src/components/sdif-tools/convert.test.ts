// @vitest-environment node
import { readFile } from "node:fs/promises";
import { expect, it, vi } from "vitest";
import { executeTool } from "../audio-tools/wasi";
import { encodeAudio } from "../audio-tools/audio";
import type { ToolRequest } from "../audio-tools/types";
import { convertSdif } from "./convert";
import {
    defaults,
    exampleSdif,
    prepare,
    readSdif,
    streamInfo,
    verifyAds
} from "./format";
vi.mock("../audio-tools/runner", () => ({
    runTool: (request: ToolRequest) => run(request)
}));
const modules = new Map<string, WebAssembly.Module>();
async function run(request: ToolRequest) {
    if (!modules.has(request.tool))
        modules.set(
            request.tool,
            await WebAssembly.compile(
                await readFile(
                    `node_modules/@csound/wasm-bin/lib/${request.tool}.wasm`
                )
            )
        );
    return executeTool(modules.get(request.tool)!, request);
}
const signal = () => new AbortController().signal;
const status = () => {};
const convert = (
    data = exampleSdif(),
    settings = defaults(streamInfo(readSdif(data))[0])
) =>
    convertSdif(
        { file: { name: "voice.sdif", data }, settings },
        signal(),
        status
    );
it("runs published sdif2ad and checks every time, amplitude and frequency", async () => {
    const source = exampleSdif(),
        result = await convert(source);
    expect(result.name).toBe("voice.het");
    expect(result.tracks).toHaveLength(3);
    expect(result.duration).toBe(2);
    verifyAds(result.data, result.tracks);
    expect(result.tracks[0].points[3 * 40 + 1]).toBe(8191);
});
it("reads real hetro SDIF output and converts all its tracks", async () => {
    const file = await run({
        tool: "hetro",
        args: ["-f220", "-h3", "input.wav", "output.sdif"],
        files: [
            {
                name: "input.wav",
                data: encodeAudio({
                    sampleRate: 8000,
                    channels: [
                        Float32Array.from(
                            { length: 4000 },
                            (_, i) =>
                                0.15 *
                                    Math.sin((2 * Math.PI * 220 * i) / 8000) +
                                0.1 * Math.sin((2 * Math.PI * 440 * i) / 8000) +
                                0.08 * Math.sin((2 * Math.PI * 660 * i) / 8000)
                        )
                    ]
                })
            }
        ],
        output: "output.sdif"
    });
    const result = await convert(file.data);
    expect(result.tracks).toHaveLength(3);
    expect(result.duration).toBeGreaterThan(0.4);
});
it("applies gain, track limit and a shifted window with interpolated boundaries", async () => {
    const bytes = exampleSdif(),
        settings = defaults(streamInfo(readSdif(bytes))[0]);
    const result = await convert(bytes, {
        ...settings,
        start: 0.5125,
        end: 1.5125,
        partials: 1,
        gain: -6
    });
    expect(result.tracks).toHaveLength(1);
    expect(result.omitted).toBe(2);
    expect(result.duration).toBe(1);
    expect(result.tracks[0].points[0]).toBe(0);
    expect(result.tracks[0].points[1]).toBeGreaterThan(1000);
    expect(result.tracks[0].points[1]).toBeLessThan(8191);
});
it("remaps sparse track IDs, zero IDs and isolates the chosen stream", async () => {
    const first = exampleSdif(),
        second = first.slice(),
        v = new DataView(second.buffer);
    for (let offset = 16; offset < second.length; ) {
        v.setUint32(offset + 16, 42);
        for (let row = 0; row < 3; row++)
            v.setFloat32(offset + 40 + row * 16, row === 0 ? 0 : 9000 + row);
        offset += 8 + v.getUint32(offset + 4);
    }
    const data = new Uint8Array(first.length + second.length - 16);
    data.set(first);
    data.set(second.subarray(16), first.length);
    const streams = streamInfo(readSdif(data));
    expect(streams.map((s) => s.id)).toEqual([1, 42]);
    const result = await convert(data, defaults(streams[1]));
    expect(result.tracks.map((t) => t.id)).toEqual([0, 9001, 9002]);
});
it("skips unrelated chunks, preserving valid following frames", async () => {
    const first = exampleSdif(),
        data = new Uint8Array(first.length + 16);
    data.set(first.subarray(0, 16));
    data.set(new TextEncoder().encode("1NVT"), 16);
    new DataView(data.buffer).setUint32(20, 8);
    data.set(first.subarray(16), 32);
    expect((await convert(data)).data).toEqual((await convert(first)).data);
});
it("keeps absent tracks silent instead of joining two births", async () => {
    const stream = readSdif(exampleSdif())[0];
    stream.tracks.set(
        1,
        stream.tracks.get(1)!.filter((p) => p.frame < 20 || p.frame > 40)
    );
    const settings = defaults(streamInfo([stream])[0]),
        normalized = prepare(stream, settings);
    const result = await convert(
        normalized.bytes,
        defaults(streamInfo(readSdif(normalized.bytes))[0])
    );
    for (let frame = 20; frame <= 40; frame++)
        expect(result.tracks[0].points[frame * 3 + 1]).toBe(0);
});
it("accepts float64 matrices before normalizing for the float32-only native reader", async () => {
    const source = exampleSdif(),
        input = new DataView(source.buffer),
        parts = [source.subarray(0, 16)];
    for (let offset = 16; offset < source.length; ) {
        const oldSize = input.getUint32(offset + 4) + 8,
            rows = input.getUint32(offset + 32),
            part = new Uint8Array(40 + rows * 32),
            view = new DataView(part.buffer);
        part.set(source.subarray(offset, offset + 40));
        view.setUint32(4, part.length - 8);
        view.setUint32(28, 8);
        for (let n = 0; n < rows * 4; n++)
            view.setFloat64(40 + n * 8, input.getFloat32(offset + 40 + n * 4));
        parts.push(part);
        offset += oldSize;
    }
    const bytes = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let offset = 0;
    for (const part of parts) {
        bytes.set(part, offset);
        offset += part.length;
    }
    expect((await convert(bytes)).data).toEqual((await convert(source)).data);
});
it("requires an explicit shorter range for a source beyond the adsyn time limit", async () => {
    const bytes = exampleSdif(),
        view = new DataView(bytes.buffer);
    for (
        let offset = 16;
        offset < bytes.length;
        offset += 8 + view.getUint32(offset + 4)
    )
        view.setFloat64(offset + 8, view.getFloat64(offset + 8) * 20);
    const settings = defaults(streamInfo(readSdif(bytes))[0]);
    expect(settings.end).toBe(32.76);
    expect((await convert(bytes, settings)).duration).toBeCloseTo(32.76, 2);
    await expect(convert(bytes, { ...settings, end: 40 })).rejects.toThrow(
        /32.76/
    );
});
it("prevents clipping and out-of-range frequencies before native short casts", async () => {
    const data = exampleSdif(),
        v = new DataView(data.buffer);
    v.setFloat32(16 + 48, 2);
    await expect(convert(data)).rejects.toThrow(/Lower the gain/);
    const settings = defaults(streamInfo(readSdif(data))[0]);
    expect(
        (await convert(data, { ...settings, gain: -12 })).tracks
    ).toHaveLength(3);
    v.setFloat32(16 + 44, 40000);
    await expect(convert(data)).rejects.toThrow(/32767 Hz/);
});
it.each([
    (v: DataView) => v.setUint32(20, 0xffffffff),
    (v: DataView) => v.setUint32(16 + 32, 0xffffffff),
    (v: DataView) => v.setUint32(16 + 36, 3),
    (v: DataView) => v.setFloat64(16 + 8, NaN),
    (v: DataView) => v.setFloat32(16 + 40, 1.5),
    (v: DataView) => v.setFloat32(16 + 56, 1),
    (v: DataView) => v.setFloat32(16 + 48, -1),
    (v: DataView) => v.setFloat32(16 + 44, Infinity)
])("rejects malformed SDIF before running native code", (change) => {
    const data = exampleSdif();
    change(new DataView(data.buffer));
    expect(() => readSdif(data)).toThrow();
});
it("rejects truncation and checks native output boundaries", async () => {
    const data = exampleSdif();
    expect(() => readSdif(data.slice(0, -1))).toThrow();
    const result = await convert(data);
    expect(() => verifyAds(result.data.slice(0, -2), result.tracks)).toThrow();
});
