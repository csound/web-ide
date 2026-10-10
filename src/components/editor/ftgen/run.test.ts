// @vitest-environment node
import { readFileSync, existsSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { generateTable } from "./run";
const path = ".wasm-build/csound-ftgen.wasm";
let module: WebAssembly.Module;
beforeAll(async () => {
    if (existsSync(path))
        module = await WebAssembly.compile(readFileSync(path));
});
const generate = (fields: number[], gen?: string) =>
    generateTable(module, { sampleRate: 48000, tables: [{ fields, gen }] });
describe.skipIf(!existsSync(path))("native GEN WASM", () => {
    it("contains no engine, parser or file imports and stays small", () => {
        expect(readFileSync(path).length).toBeLessThan(300000);
        expect(
            WebAssembly.Module.imports(module).every(
                (i) => i.module === "wasi_snapshot_preview1"
            )
        ).toBe(true);
    });
    it("generates GEN10 including its guard point", async () => {
        const samples = await generate([1, 0, 8192, 10, 1]);
        expect(samples).toHaveLength(8193);
        expect(samples[2048]).toBeCloseTo(1, 10);
        expect(samples[6144]).toBeCloseTo(-1, 10);
        expect(samples[8192]).toBeCloseTo(samples[0], 10);
    });
    it("matches the supplied trisaw breakpoints", async () => {
        const samples = await generate([
            0, 0, 1024, 7, 1, 5, -0.6, 246, 0.3, 5, -0.3, 251, 0.6, 5, -1, 512,
            1
        ]);
        expect(samples).toHaveLength(1025);
        for (const [index, value] of [
            [0, 1],
            [5, -0.6],
            [251, 0.3],
            [256, -0.3],
            [507, 0.6],
            [512, -1],
            [1024, 1]
        ])
            expect(samples[index]).toBeCloseTo(value, 8);
    });
    it("keeps negative GEN amplitudes and deferred GEN2 lengths", async () => {
        expect(Array.from(await generate([0, 0, 0, -2, 2, -3, 4]))).toEqual([
            2, -3, 4, 2
        ]);
        expect((await generate([0, 0, 8, -10, 2]))[2]).toBeCloseTo(2);
    });
    it("resolves source tables with native GEN24", async () => {
        const result = await generateTable(module, {
            sampleRate: 48000,
            tables: [
                { fields: [1, 0, 8, -7, -1, 8, 1] },
                { fields: [2, 0, 8, -24, 1, 0, 10] }
            ]
        });
        expect(result[0]).toBeCloseTo(0);
        expect(result[7]).toBeCloseTo(10);
    });
    it("supports windows, random and named curves", async () => {
        expect((await generate([1, 0, 1024, 20, 2]))[512]).toBeCloseTo(1);
        const random = await generate([1, 0, 128, 21, 1]);
        expect(random).toEqual(await generate([1, 0, 128, 21, 1]));
        expect(
            (await generate([1, 0, 1024, 0, -3, 3, 1], "tanh"))[0]
        ).toBeCloseTo(Math.tanh(-3));
    });
    it("uses native FFT helpers for a source-table harmonic filter", async () => {
        const filtered = await generateTable(module, {
            sampleRate: 48000,
            tables: [
                { fields: [1, 0, 64, 10, 1, 0.5] },
                { fields: [2, 0, 128, 30, 1, 1, 1] }
            ]
        });
        const sine = await generate([1, 0, 128, 10, 1]);
        for (let i = 0; i < sine.length; i++)
            expect(filtered[i]).toBeCloseTo(sine[i], 8);
    });
    it.each([
        [1, 0, 1073741824, 10, 1],
        [1, 0, 64, 99, 1],
        [1, 0, 64, 5, 0, 64, 1],
        [1, 0, 64, 1, 1]
    ])("rejects invalid or unavailable GEN input %j", async (...fields) => {
        await expect(generate(fields)).rejects.toThrow();
    });
});
