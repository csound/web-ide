// @vitest-environment node
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { executeTool } from "../audio-tools/wasi";
import {
    decimalScore,
    scoreExamples,
    scoreRequest,
    scoreResult
} from "./convert";
import type { ScoreProgram } from "./programs";

describe("shipped score programs", () => {
    it.each(["csbeats", "scot"] as const)(
        "rejects %s partial output after a parse error",
        async (program) => {
            const module = await WebAssembly.compile(
                await readFile(
                    `node_modules/@csound/wasm-bin/lib/${program}.wasm`
                )
            );
            const source =
                program === "scot"
                    ? "orchestra { voice=1 }\nscore { $voice 4c nonsense }"
                    : "i1 m1 b1 C4 q mf\nnonsense\n";
            const result = await executeTool(
                module,
                scoreRequest({ program, source, selection: "" })
            );
            expect(() => scoreResult(program, result)).toThrow();
        }
    );
    it.each<ScoreProgram>(["csbeats", "scot", "scsort", "extract"])(
        "converts %s through WASI",
        async (program) => {
            const bytes = await readFile(
                `node_modules/@csound/wasm-bin/lib/${program}.wasm`
            );
            const module = await WebAssembly.compile(bytes);
            const request = scoreRequest({
                program,
                source: scoreExamples[program],
                selection: "i 1"
            });
            const result = scoreResult(
                program,
                await executeTool(module, request)
            );
            if (program === "csbeats" || program === "scot")
                expect(result.text.match(/^i/gm)).toHaveLength(4);
            expect(result.text).toMatch(/^i\s*1/m);
            if (program === "extract")
                expect(result.text).not.toMatch(/^i\s*2/m);
        }
    );
    it("extracts sorted events without losing p-fields or timing", async () => {
        const request = {
            program: "scsort" as const,
            source: "t 0 120\ni1 2 1 440\ni2 1 1 330\ni1 0 1 220\ne\n",
            selection: "i 1"
        };
        const sorter = await WebAssembly.compile(
            await readFile("node_modules/@csound/wasm-bin/lib/scsort.wasm")
        );
        const sorted = scoreResult(
            "scsort",
            await executeTool(sorter, scoreRequest(request))
        );
        expect(sorted.text).not.toContain("0x");
        const extractor = await WebAssembly.compile(
            await readFile("node_modules/@csound/wasm-bin/lib/extract.wasm")
        );
        const extracted = scoreResult(
            "extract",
            await executeTool(
                extractor,
                scoreRequest({
                    ...request,
                    program: "extract",
                    source: sorted.text
                })
            )
        );
        expect(extracted.text).toMatch(/^i 1 0 0 1 0\.5 220$/m);
        expect(extracted.text).toMatch(/^i 1 2 1 1 0\.5 440$/m);
        expect(extracted.text).not.toMatch(/^i 2/m);
    });
});

it("renders hex floats as decimal while preserving quoted p-fields", () => {
    expect(decimalScore('i 1 0x1p+1 -0x1.8p-1 +0x1p+0 "0x1p+4"\n')).toBe(
        'i 1 2 -0.75 1 "0x1p+4"\n'
    );
    expect(decimalScore("0x0.0000000000001p-1022")).toBe(
        String(Number.MIN_VALUE)
    );
});

it("rejects malformed extraction controls and oversized input before running a worker", () => {
    const request = {
        program: "extract" as const,
        source: "i1 0 1 440",
        selection: "f nope"
    };
    expect(() => scoreRequest(request)).toThrow("section:beat");
    expect(() =>
        scoreRequest({
            ...request,
            selection: "i 1",
            source: "a".repeat(1024 * 1024 + 1)
        })
    ).toThrow("1 MB");
});
