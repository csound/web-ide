// @vitest-environment node
import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";
import { executeTool } from "../audio-tools/wasi";
import { encodeAudio } from "../audio-tools/audio";
import type { ToolRequest } from "../audio-tools/types";
import { convertLpc, openLpc } from "./convert";
import {
    dimensions,
    exampleText,
    formatLpc,
    MAX_LPC_BYTES,
    parseLpcText,
    readLpc,
    writeLpc
} from "./format";
const modules = new Map<string, WebAssembly.Module>();
async function run(binary: string, request: ToolRequest) {
    if (!modules.has(binary))
        modules.set(
            binary,
            await WebAssembly.compile(
                await readFile(
                    `node_modules/@csound/wasm-bin/lib/${binary}.wasm`
                )
            )
        );
    return executeTool(modules.get(binary)!, request);
}
const signal = () => new AbortController().signal;
const status = () => {};
async function nativeAnalysis(poles: boolean, comment: boolean) {
    return run("lpanal", {
        tool: "lpanal",
        args: [
            "-p12",
            "-h80",
            ...(poles ? ["-a"] : []),
            ...(comment ? ["-Cvoice"] : []),
            "input.wav",
            "output.lpc"
        ],
        files: [
            {
                name: "input.wav",
                data: encodeAudio({
                    sampleRate: 8000,
                    channels: [
                        Float32Array.from(
                            { length: 4000 },
                            (_, i) =>
                                0.2 * Math.sin((2 * Math.PI * 220 * i) / 8000) +
                                0.01 *
                                    (2 *
                                        ((Math.sin(i * 12.9898) * 43758.5453) %
                                            1) -
                                        1)
                        )
                    ]
                })
            }
        ],
        output: "output.lpc"
    });
}
it.each([
    [false, false],
    [false, true],
    [true, false],
    [true, true]
])(
    "round-trips published lpanal output byte for byte (poles %s, comment %s)",
    async (poles, comment) => {
        const input = await nativeAnalysis(poles, comment);
        const before = readLpc(input.data);
        expect(before.magic).toBe(poles ? 2399 : 999);
        expect(dimensions(before).frames).toBe(49);
        const text = await openLpc(
            { name: "voice.lpc", data: input.data },
            signal(),
            status
        );
        const after = await convertLpc(
            { text, name: "voice.lpc" },
            signal(),
            status
        );
        expect(after.data).toEqual(input.data);
        expect(after.analysis).toEqual(before);
        if (comment) expect(before.extra.length).toBeGreaterThan(0);
    }
);
it("documents why the pinned lpc_import binary cannot implement text import", async () => {
    // This binary expects a binary LPHEADER, despite advertising text import.
    // Keep it out of the UI until an upstream release fixes the converter.
    await expect(
        run("lpc_import", {
            tool: "lpanal",
            args: ["input.txt", "out.lpc"],
            files: [
                {
                    name: "input.txt",
                    data: new TextEncoder().encode(
                        "40,999,2,6,100,8000,0.01\n0.01,0.1,0.01,220,-0.9,1.5\n"
                    )
                }
            ],
            output: "out.lpc"
        })
    ).rejects.toThrow();
    const input = await nativeAnalysis(false, false);
    await expect(
        run("lpc_export", {
            tool: "lpanal",
            args: ["input.lpc", "out.txt"],
            files: [{ name: "input.lpc", data: input.data }],
            output: "out.txt"
        })
    ).rejects.toThrow();
});
it("preserves all finite float64 edge values, signed zero, and opaque header bytes", async () => {
    const data = parseLpcText(exampleText);
    data.extra = new Uint8Array([0, 255, 10, 13]);
    data.values[4] = -0;
    data.values[5] = Number.MIN_VALUE;
    data.values[10] = -Number.MAX_VALUE;
    const before = writeLpc(data);
    const text = await openLpc(
        { name: "edge.lpc", data: before },
        signal(),
        status
    );
    const after = await convertLpc(
        { text, name: "edge.csv" },
        signal(),
        status
    );
    expect(after.data).toEqual(before);
    expect(after.name).toBe("edge.lpc");
});
it("accepts BOM, CRLF and spaced CSV while retaining the last frame", async () => {
    const text = "\ufeff" + exampleText.trim().replaceAll("\n", "\r\n");
    expect(
        await openLpc(
            { name: "test.txt", data: new TextEncoder().encode(text) },
            signal(),
            status
        )
    ).toBe(exampleText);
    expect(
        (await convertLpc({ text, name: "test" }, signal(), status)).text
    ).toBe(exampleText);
});
it("uses actual frame data rather than source duration to find the last frame", () => {
    const data = parseLpcText(exampleText);
    data.duration = 90;
    expect(dimensions(readLpc(writeLpc(data)))).toEqual({
        frames: 64,
        duration: 0.63
    });
});
it("rejects pasted CSV above the UTF-8 byte limit even when its character count fits", async () => {
    const text = exampleText.replace(
        "999,",
        "\u2003".repeat(Math.floor(MAX_LPC_BYTES / 3)) + "999,"
    );
    expect(text.length).toBeLessThan(MAX_LPC_BYTES);
    expect(new TextEncoder().encode(text).length).toBeGreaterThan(
        MAX_LPC_BYTES
    );
    await expect(
        convertLpc({ text, name: "large.csv" }, signal(), status)
    ).rejects.toThrow("16 MB");
});
it("accepts valid Unicode-padded CSV at the byte limit and rejects one byte more", () => {
    const remaining =
        MAX_LPC_BYTES - new TextEncoder().encode(exampleText).length;
    const padding =
        "\u2003".repeat(Math.floor(remaining / 3)) + " ".repeat(remaining % 3);
    const text = exampleText.replace("999,", padding + "999,");
    expect(new TextEncoder().encode(text).length).toBe(MAX_LPC_BYTES);
    expect(writeLpc(parseLpcText(text))).toEqual(
        writeLpc(parseLpcText(exampleText))
    );
    expect(() => parseLpcText(text + " ")).toThrow("16 MB");
});
it.each([
    (s: string) => s.replace("999,2,6", "42,2,6"),
    (s: string) => s.replace("999,2,6", "999,0,4"),
    (s: string) => s.replace("999,2,6", "999,2,8"),
    (s: string) => s.replace("999,2,6", "2399,3,10"),
    (s: string) => s.replace(",100,8000,", ",0,8000,"),
    (s: string) => s.replace(",100,8000,", ",100,1e309,"),
    (s: string) => s.replace("HeaderExtraHex,", "HeaderExtraHex,00"),
    (s: string) => s.replace("0.012,", "NaN,"),
    (s: string) => s.replace("0.012,", "-0.01,"),
    (s: string) => s.replace("0.012,", "1e-999,"),
    (s: string) => s.replace("0.012,", ","),
    (s: string) => s.split("\n").slice(0, 5).join("\n"),
    (s: string) => s.replace(/\n[^\n]*\n$/, "\n0,1\n")
])("rejects malformed edits before binary output", async (change) => {
    await expect(
        convertLpc({ text: change(exampleText), name: "bad" }, signal(), status)
    ).rejects.toThrow();
});
it("rejects truncated files, nonfinite values and forged dimensions", () => {
    const bytes = writeLpc(parseLpcText(exampleText));
    expect(() => readLpc(bytes.slice(0, -1))).toThrow();
    expect(() => readLpc(bytes.slice(0, -8))).toThrow();
    const bad = bytes.slice(),
        view = new DataView(bad.buffer);
    view.setUint32(0, 0xffffffff, true);
    expect(() => readLpc(bad)).toThrow();
    view.setUint32(0, 40, true);
    view.setFloat64(40, NaN, true);
    expect(() => readLpc(bad)).toThrow(/finite/);
});
it("does no work for an aborted request", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
        convertLpc(
            { text: exampleText, name: "test" },
            controller.signal,
            status
        )
    ).rejects.toMatchObject({ name: "AbortError" });
});
