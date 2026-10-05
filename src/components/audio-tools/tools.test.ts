// @vitest-environment node
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { executeTool } from "./wasi";
import { decodeWave, durationOf, encodeAudio } from "./audio";
import { defaultSettings, makeRequest, type WasmOperation } from "./operations";
import type { ToolName, ToolRequest } from "./types";
import { analysisPlot, binPlot } from "./plots";

const sampleRate = 16000;
const signal = Float32Array.from(
    { length: sampleRate },
    (_, index) => 0.25 * Math.sin((2 * Math.PI * 220 * index) / sampleRate)
);
const input = encodeAudio({ sampleRate, channels: [signal] });
const modules = new Map<ToolName, WebAssembly.Module>();
/** Run the installed WASM binary against the production memory filesystem. */
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
/** Build a repeatable tone-processing request for binary integration checks. */
const request = (operation: WasmOperation) =>
    makeRequest(
        operation,
        { ...defaultSettings, rate: 8000, gain: -6 },
        input,
        [0.1, 0.4],
        1
    );

describe("published WASM tools with the browser filesystem", () => {
    it("trims exact frames through the end, including every channel", () => {
        const channels = [
            Float32Array.from(
                { length: sampleRate * 2 },
                (_, index) => index / (sampleRate * 2)
            ),
            Float32Array.from(
                { length: sampleRate * 2 },
                (_, index) => -index / (sampleRate * 2)
            )
        ];
        const result = decodeWave(
            encodeAudio({ sampleRate, channels }, [0.5, 2])
        );
        expect(durationOf(result)).toBe(1.5);
        expect(result.sampleRate).toBe(sampleRate);
        expect(result.channels).toEqual(
            channels.map((channel) => channel.slice(sampleRate / 2))
        );
    });
    it("changes gain and peak level", async () => {
        const scaled = decodeWave((await run(request("gain"))).data);
        expect(Math.max(...scaled.channels[0])).toBeCloseTo(
            0.25 * 10 ** (-6 / 20),
            3
        );
        const normalized = decodeWave((await run(request("normalize"))).data);
        expect(Math.max(...normalized.channels[0])).toBeCloseTo(
            10 ** (-1 / 20),
            3
        );
    });
    it("resamples without changing duration", async () => {
        const result = decodeWave((await run(request("resample"))).data);
        expect(result.sampleRate).toBe(8000);
        expect(durationOf(result)).toBeCloseTo(1, 2);
    });
    it("uses a selected noise reference", async () => {
        const result = decodeWave((await run(request("denoise"))).data);
        expect(result.sampleRate).toBe(sampleRate);
        expect(result.channels[0].length).toBeGreaterThan(0);
        expect(Math.max(...result.channels[0])).toBeLessThan(0.25);
    });
    it.each(["gain", "normalize", "resample", "denoise"] as const)(
        "preserves stereo channels and duration for %s",
        async (operation) => {
            const source = encodeAudio({
                sampleRate,
                channels: [signal, signal]
            });
            const result = decodeWave(
                (
                    await run(
                        makeRequest(
                            operation,
                            defaultSettings,
                            source,
                            [0.1, 0.4],
                            1
                        )
                    )
                ).data
            );
            expect(result.channels).toHaveLength(2);
            expect(durationOf(result)).toBeCloseTo(1, 2);
        }
    );
    it.each(["spectrum", "partials", "harmonics", "lpc", "envelope"] as const)(
        "creates %s analysis",
        async (operation) => {
            const result = await run(request(operation));
            expect(result.data.length).toBeGreaterThan(80);
            const plot = analysisPlot(operation, result.data, 1);
            expect(plot.max).toBeGreaterThan(0);
            if (plot.kind === "lines")
                expect(
                    plot.series
                        .flat()
                        .some(([, value]) => Number.isFinite(value))
                ).toBe(true);
        }
    );
    it("inspects a generated PVOC-EX file", async () => {
        const pvx = await run(request("spectrum"));
        const result = await run({
            tool: "pvlook",
            args: ["-bf", "2", "-ef", "2", "input.pvx"],
            files: [{ name: "input.pvx", data: pvx.data }],
            output: "stdout"
        });
        expect(new TextDecoder().decode(result.data)).toContain("Bin 1 Freqs.");
        expect(binPlot(result.data, sampleRate).kind).toBe("lines");
    });
    it("reports tool errors without a result", async () => {
        await expect(
            run({ ...request("spectrum"), files: [] })
        ).rejects.toThrow();
    });
});
