// @vitest-environment node
import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import { decodeWave, durationOf, encodeAudio } from "./audio";
import { executeTool } from "./wasi";
import {
    buildMix,
    makeMixRequest,
    mixLayout,
    prepareMixAudio,
    trackDefaults,
    type MixTrack
} from "./mixer";
import type { ToolRequest } from "./types";

vi.mock("./runner", () => ({
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
function track(id: string, left = 0.2, right = 0.1): MixTrack {
    const audio = {
        sampleRate: 8000,
        channels: [
            new Float32Array(8000).fill(left),
            new Float32Array(8000).fill(right)
        ]
    };
    return {
        ...trackDefaults,
        id,
        name: `${id}.wav`,
        audio,
        data: encodeAudio(audio)
    };
}
async function mix(tracks: MixTrack[], gain = 0) {
    return decodeWave(
        (await run(await makeMixRequest({ tracks, gain }, signal()))).data
    );
}
describe("published mixer with the browser filesystem", () => {
    it("preserves leading silence and gaps longer than the native block size", async () => {
        const result = await mix([
            { ...track("first"), start: 2 },
            { ...track("second", 0.4, 0.3), start: 20 }
        ]);
        expect(durationOf(result)).toBe(21);
        expect(result.channels).toHaveLength(2);
        expect(result.channels[0][15999]).toBe(0);
        expect(result.channels[0][16000]).toBeCloseTo(0.2);
        expect(result.channels[0][100000]).toBe(0);
        expect(result.channels[0][160000]).toBeCloseTo(0.4);
        expect(result.channels[1][160000]).toBeCloseTo(0.3);
    });
    it("sums overlapping tracks with track and output gain", async () => {
        const result = await mix(
            [track("one"), { ...track("two"), gain: -6 }],
            -3
        );
        expect(result.channels[0][4000]).toBeCloseTo(
            (0.2 + 0.2 * 10 ** (-6 / 20)) * 10 ** (-3 / 20),
            5
        );
    });
    it.each([
        ["swap", 0.1, 0.2],
        ["left", 0.2, 0],
        ["right", 0, 0.1]
    ] as const)(
        "routes %s without changing the stereo header or duration",
        async (route, left, right) => {
            const result = await mix([{ ...track("one"), route }]);
            expect(result.channels).toHaveLength(2);
            expect(durationOf(result)).toBe(1);
            expect(result.channels[0][4000]).toBeCloseTo(left);
            expect(result.channels[1][4000]).toBeCloseTo(right);
        }
    );
    it("honours solo and mute, including an entirely silent mix", async () => {
        const tracks = [
            track("one", 0.8, 0.6),
            { ...track("two"), solo: true, start: 0.5 }
        ];
        const solo = await mix(tracks);
        expect(solo.channels[0][0]).toBe(0);
        expect(solo.channels[0][4000]).toBeCloseTo(0.2);
        const muted = await mix(
            tracks.map((value) => ({ ...value, muted: true }))
        );
        expect(durationOf(muted)).toBe(1.5);
        expect(
            muted.channels.every((channel) =>
                channel.every((value) => value === 0)
            )
        ).toBe(true);
    });
    it("imports mono and resamples once without changing pitch or duration", async () => {
        const bytes = encodeAudio({
            sampleRate: 16000,
            channels: [
                Float32Array.from(
                    { length: 16000 },
                    (_, index) =>
                        0.3 * Math.sin((2 * Math.PI * index * 220) / 16000)
                )
            ]
        });
        const prepared = await prepareMixAudio(bytes, 8000, signal(), () => {});
        expect(prepared.audio.sampleRate).toBe(8000);
        expect(durationOf(prepared.audio)).toBeCloseTo(1, 2);
        expect(prepared.audio.channels).toHaveLength(2);
        expect(prepared.audio.channels[0]).toEqual(prepared.audio.channels[1]);
        expect(Math.max(...prepared.audio.channels[0])).toBeCloseTo(0.3, 2);
    });
    it.each([
        [0.8, 0.1, 1.6],
        [0.1, -1.2, 2.4]
    ])(
        "retains floating-point peaks above full scale (%s left, %s right)",
        async (left, right, peak) => {
            const result = await buildMix(
                {
                    tracks: [
                        track("one", left, right),
                        track("two", left, right)
                    ],
                    gain: 0
                },
                signal(),
                () => {}
            );
            expect(result.peak).toBeCloseTo(peak);
            expect(result.audio.channels[0][4000]).toBeCloseTo(left * 2);
            expect(result.audio.channels[1][4000]).toBeCloseTo(right * 2);
        }
    );
    it("rejects invalid settings and oversized arrangements before running WASM", () => {
        const value = track("one");
        for (const start of [NaN, -1, 100000])
            expect(() =>
                mixLayout({ tracks: [{ ...value, start }], gain: 0 })
            ).toThrow();
        expect(() => mixLayout({ tracks: [value], gain: Infinity })).toThrow();
        expect(() =>
            mixLayout({ tracks: Array(17).fill(value), gain: 0 })
        ).toThrow(/16 tracks/);
    });
    it("cancels while preparing the mix", async () => {
        const controller = new AbortController();
        const job = makeMixRequest(
            { tracks: [track("one")], gain: 0 },
            controller.signal
        );
        controller.abort();
        await expect(job).rejects.toMatchObject({ name: "AbortError" });
    });
});
