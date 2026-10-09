// @vitest-environment node
import { readFile } from "node:fs/promises";
import { expect, it, vi } from "vitest";
import { executeTool } from "../audio-tools/wasi";
import { encodeAudio } from "../audio-tools/audio";
import type { ToolRequest } from "../audio-tools/types";
import { convertPvx, openPvx } from "./convert";
import {
    dimensions,
    exampleText,
    formatPvx,
    parsePvxText,
    readPvx,
    spectrum
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
it("round-trips all values through the published import and export binaries", async () => {
    const output = await convertPvx(
        { text: exampleText, name: "example.txt" },
        signal(),
        status
    );
    expect(output.name).toBe("example.pvx");
    expect(readPvx(output.data).analysis).toEqual(parsePvxText(exampleText));
    expect(await openPvx(output, signal(), status)).toBe(exampleText);
});
it.each([1, 2])(
    "preserves full float precision from actual pvanal output (%s channels)",
    async (channels) => {
        const audio = {
            sampleRate: 8000,
            channels: Array.from({ length: channels }, (_, channel) =>
                Float32Array.from(
                    { length: 2400 },
                    (_, i) =>
                        0.2 *
                        Math.sin(
                            (2 * Math.PI * i * (channel ? 660 : 440)) / 8000
                        )
                )
            )
        };
        const input = await run({
            tool: "pvanal",
            args: ["-n128", "-h32", "input.wav", "input.pvx"],
            files: [{ name: "input.wav", data: encodeAudio(audio) }],
            output: "input.pvx"
        });
        const before = readPvx(input.data).analysis;
        expect(dimensions(before).channels).toBe(channels);
        const text = await openPvx(
            { name: "input.pvx", data: input.data },
            signal(),
            status
        );
        const after = await convertPvx(
            { text, name: "input.pvx" },
            signal(),
            status
        );
        expect(after.analysis).toEqual(before);
        // No frame values or source-type bits change through editing and saving.
        expect(readPvx(after.data).analysis.values).toEqual(before.values);
    }
);
it("adds the final newline and accepts CRLF without losing the last frame", async () => {
    const result = await convertPvx(
        { text: exampleText.trim().replaceAll("\n", "\r\n"), name: "frames" },
        signal(),
        status
    );
    expect(result.analysis).toEqual(parsePvxText(exampleText));
});
it.each([1, 2])(
    "preserves phase and complex analysis format %s",
    async (format) => {
        const data = parsePvxText(exampleText);
        data.pv[1] = format;
        data.values[1] = -0.25;
        if (format === 2) data.values[0] = -0.75;
        const result = await convertPvx(
            { text: formatPvx(data), name: "analysis" },
            signal(),
            status
        );
        expect(result.analysis).toEqual(data);
    }
);
it("keeps channels distinct in the frame spectrum", () => {
    const data = parsePvxText(exampleText);
    data.wave[1] = 2;
    data.wave[3] *= 2;
    data.wave[4] *= 2;
    data.values.fill(0);
    data.values[2] = 0.25;
    data.values[66 + 4] = 0.75;
    expect(dimensions(data).frames).toBe(32);
    expect(spectrum(data, 0, 0).max).toBe(0.25);
    expect(spectrum(data, 0, 1).max).toBe(0.75);
});

it("retains negative zero and the smallest float32 in editable text", async () => {
    const analysis = parsePvxText(exampleText);
    analysis.pv[1] = 2;
    analysis.values[0] = -0;
    analysis.values[1] = Math.fround(1e-45);
    const result = await convertPvx(
        { text: formatPvx(analysis), name: "edge" },
        signal(),
        status
    );
    expect(Object.is(result.analysis.values[0], -0)).toBe(true);
    expect(result.analysis.values[1]).toBe(analysis.values[1]);
});
it.each(["1e-400", "+1E-400", "-1e-400", ".0001e-400", "1e-100"])(
    "rejects nonzero %s instead of silently exporting zero",
    (value) => {
        const lines = exampleText.trim().split("\n");
        const cells = lines[4].split(",");
        cells[0] = value;
        lines[4] = cells.join(",");
        expect(() => parsePvxText(lines.join("\n"))).toThrow(/float range/);
    }
);
it.each(["0e-400", "-0e-400", "+0.000e-400", "0e+400"])(
    "preserves literal zero %s through native conversion",
    async (value) => {
        const lines = exampleText.trim().split("\n");
        const cells = lines[4].split(",");
        cells[0] = value;
        lines[4] = cells.join(",");
        const output = await convertPvx(
            { text: lines.join("\n"), name: "zero" },
            signal(),
            status
        );
        expect(Object.is(output.analysis.values[0], Number(value))).toBe(true);
    }
);
it.each([
    ["", 5],
    ["\n", 6],
    ["\uFEFF \r\n\t\r\n", 7]
])(
    "keeps the editor row offset for prefix %j",
    async (prefix, firstDataRow) => {
        const output = await convertPvx(
            { text: prefix + exampleText, name: "rows" },
            signal(),
            status
        );
        expect(output).toHaveProperty("firstDataRow", firstDataRow);
        expect(output.text).toBe(exampleText);
    }
);
it.each([
    (s: string) => s.replace("65534,1", "65534,0"),
    (s: string) => s.replace("33,64,64,264", "33,64,0,264"),
    (s: string) => s.replace("33,64,64,264", "33,64,64,128"),
    (s: string) => s.replace("0,0,1,1,33", "0,0,1,4,33"),
    (s: string) => s.replace("0,0,1,1,33", "1,0,1,1,33"),
    (s: string) => s.replace("264,125", "264,999"),
    (s: string) => s.split("\n").slice(0, 4).join("\n"),
    (s: string) => s.replace(/\n([^\n]*)\n$/, "\n0,1\n"),
    (s: string) => s.replace(/\n([^\n]*)\n$/, "\nNaN,1\n"),
    (s: string) => s.replace(/\n([^\n]*)\n$/, "\n1e40,1\n")
])("rejects invalid edits before native conversion", async (change) => {
    await expect(
        convertPvx({ text: change(exampleText), name: "bad" }, signal(), status)
    ).rejects.toThrow();
});
it("rejects truncated, forged, and custom-window binaries before exporting", async () => {
    const { data } = await convertPvx(
        { text: exampleText, name: "test" },
        signal(),
        status
    );
    expect(() => readPvx(data.slice(0, -1))).toThrow(/complete/);
    const { fmtOffset } = readPvx(data);
    const forged = data.slice();
    new DataView(forged.buffer).setUint32(fmtOffset + 56, 0xffffffff, true);
    expect(() => readPvx(forged)).toThrow(/AnalysisBins/);
    const custom = data.slice();
    new DataView(custom.buffer).setUint16(fmtOffset + 54, 4, true);
    expect(() => readPvx(custom)).toThrow(/custom windows/);
});
