// @vitest-environment node
import { readFile } from "node:fs/promises";
import { expect, it, vi } from "vitest";
import { executeTool } from "../audio-tools/wasi";
import { encodeAudio } from "../audio-tools/audio";
import type { ToolRequest } from "../audio-tools/types";
import {
    convertHetro,
    exampleText,
    formatHetro,
    openHetro,
    parseHetroBinary,
    parseHetroText
} from "./convert";
vi.mock("../audio-tools/runner", () => ({
    runTool: (request: ToolRequest) => run(request)
}));
const modules = new Map<string, WebAssembly.Module>();
const commands: string[] = [];
async function run(request: ToolRequest) {
    commands.push(request.tool);
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
it("round-trips editable text through both published binaries without changing points", async () => {
    const output = await convertHetro(
        { text: exampleText, name: "partials.txt" },
        signal(),
        status
    );
    expect(output.name).toBe("partials.het");
    expect(parseHetroBinary(output.data)).toEqual(parseHetroText(exampleText));
    expect(await openHetro(output, signal(), status)).toBe(exampleText);
    expect(commands).toContain("het_import");
    expect(commands).toContain("het_export");
});
it.each([8000, 800])(
    "reads the IDE's harmonics analysis for %s samples",
    async (frames) => {
        const audio = {
            sampleRate: 8000,
            channels: [
                Float32Array.from(
                    { length: frames },
                    (_, index) =>
                        0.2 * Math.sin((2 * Math.PI * index * 220) / 8000)
                )
            ]
        };
        const result = await run({
            tool: "hetro",
            args: ["-X", "-f220", "-h3", "input.wav", "analysis.het"],
            files: [{ name: "input.wav", data: encodeAudio(audio) }],
            output: "analysis.het"
        });
        const text = await openHetro(
            { name: "analysis.het", data: result.data },
            signal(),
            status
        );
        expect(parseHetroText(text).partials).toBe(3);
        const binary = await convertHetro(
            { text, name: "analysis.het" },
            signal(),
            status
        );
        expect(parseHetroBinary(binary.data)).toEqual(parseHetroText(text));
    }
);
it("adds the final newline, normalizes CRLF and whitespace, and preserves all values", async () => {
    const source = exampleText
        .trim()
        .replaceAll(",", ", ")
        .replaceAll("\n", "\r\n");
    const result = await convertHetro(
        { text: source, name: "test.csv" },
        signal(),
        status
    );
    expect(await openHetro(result, signal(), status)).toBe(exampleText);
});
it("preserves maximum amplitudes despite het_export's END-value bug", async () => {
    const text = exampleText.replace("16000", "32767");
    const output = await convertHetro({ text, name: "peak" }, signal(), status);
    expect(await openHetro(output, signal(), status)).toBe(text);
});
it("supports older binary files that omit the partial count", async () => {
    const result = await convertHetro(
        { text: exampleText, name: "old" },
        signal(),
        status
    );
    expect(
        await openHetro(
            { name: "old.het", data: result.data.slice(2) },
            signal(),
            status
        )
    ).toBe(exampleText);
});
it.each([
    exampleText.replace("16000", "1.5"),
    exampleText.replace("16000", "40000"),
    exampleText.replace("700,10000", "39,10000"),
    exampleText.replace("40,16000", "32767,16000"),
    exampleText.replace("40,16000", "40,"),
    exampleText.replace("HETRO 2", "HETRO 3"),
    exampleText.replace("-2", "-1"),
    "HETRO 1,-1\n-2,0,220\n"
])("rejects malformed text before the permissive native importer", (text) => {
    expect(() => parseHetroText(text)).toThrow();
});
it("rejects incomplete binary data", async () => {
    const result = await convertHetro(
        { text: exampleText, name: "test" },
        signal(),
        status
    );
    expect(() => parseHetroBinary(result.data.slice(0, -1))).toThrow(
        /truncated/
    );
    expect(() => parseHetroBinary(result.data.slice(0, -2))).toThrow(
        /unfinished/
    );
});
it("normalizes the separate header and explicit END markers", () => {
    expect(
        formatHetro(
            parseHetroText(
                "HETRO 1\n-1,0,0,100,0,32767\n-2,0,220,100,220,32767\n"
            )
        )
    ).toBe("HETRO 1,-1,0,0,100,0\n-2,0,220,100,220\n");
});
