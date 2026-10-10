import { describe, expect, it } from "vitest";
import {
    findTables,
    numberExpression,
    tableRequest,
    tableLinks
} from "./source";
const resolve = (text: string, filename = "piece.orc") =>
    tableRequest(text, filename, findTables(text, filename).at(-1)!);
describe("table source", () => {
    it("finds orchestra and score targets, including space after f", () => {
        const text =
            "<CsInstruments>\ngiWave ftgen 0,0,1024,10,1\n</CsInstruments>\n<CsScore>\nf  1 0 8192 10 1\n</CsScore>";
        const defs = findTables(text, "piece.csd");
        expect(defs.map((d) => text.slice(d.from, d.to))).toEqual([
            "giWave",
            "f  1"
        ]);
        expect(defs.map((d) => d.name)).toEqual(["giWave", "f1"]);
    });
    it("ignores comments, strings, options and preprocessed scores", () => {
        expect(
            findTables(
                '; giFake ftgen 0,0,8,10,1\n/*\ngiFake ftgen 0,0,8,10,1\n*/\nSx = "giFake ftgen 0,0,8,10,1"',
                "piece.orc"
            )
        ).toEqual([]);
        expect(
            findTables(
                '<CsOptions>giFake ftgen 0,0,8,10,1</CsOptions><CsScore bin="csbeats">f 1 0 8 10 1</CsScore>',
                "piece.csd"
            )
        ).toEqual([]);
    });
    it("joins comma and backslash continuations and function syntax", () => {
        expect(
            resolve("giWave = ftgen(0, 0,\n 2^10, 10, \\\n 1, .5)\n").tables[0]
                .fields
        ).toEqual([101, 0, 1024, 10, 1, 0.5]);
    });
    it("uses numeric constants and only the requested dependencies", () => {
        const request = resolve(
            'giSize = 2^10\ngiFile ftgen 0,0,0,1,"absent.wav",0,0,1\ngiWave ftgen 1,0,giSize,10,1\ngiShape ftgen 0,0,giSize,-24,giWave,-2,2'
        );
        expect(request.tables.map((t) => t.fields[3])).toEqual([10, -24]);
    });
    it.each([
        "giWave = ftgen(0, 0, 1024, 10, 1)",
        "  giWave = ftgen:i(0, 0, 1024, 10, 1)",
        "  giWave = ftgen(\n    0, 0, 1024, 10, 1\n  )",
        "giWave:i = ftgen(0, 0, 1024, 10, 1)"
    ])("resolves a function-form source table: %s", (source) => {
        const request = resolve(
            `${source}\ngiShape = ftgen(0,0,1024,-24,giWave,-2,2)`
        );
        expect(request.tables.map((t) => t.fields)).toEqual([
            [101, 0, 1024, 10, 1],
            [102, 0, 1024, -24, 101, -2, 2]
        ]);
    });
    it("still invalidates a table variable reassigned to a runtime value", () => {
        expect(() =>
            resolve(
                "giWave = ftgen(0,0,1024,10,1)\ngiWave = p4\ngiShape ftgen 0,0,1024,-24,giWave,-2,2"
            )
        ).toThrow(/numeric/);
    });
    it("rejects runtime parameters and missing sources without evaluating code", () => {
        expect(() => resolve("giWave ftgen 0,0,1024,10,p4")).toThrow(/numeric/);
        expect(() => resolve("giWave ftgen 2,0,1024,24,1,0,1")).toThrow(
            /source table 1/
        );
        expect(() => numberExpression("globalThis.process.exit()")).toThrow();
    });
    it("accepts named GENs and bracketed score arithmetic", () => {
        expect(
            resolve('f1 0 [2 ^ 10] "tanh" -3 3 1', "piece.sco").tables[0]
        ).toEqual({ fields: [1, 0, 1024, 0, -3, 3, 1], gen: "tanh" });
    });
    it("accepts typed Csound 7 variables and compact function calls", () => {
        expect(
            resolve("shape:i=ftgen(0,0,2^10,10,1)").tables[0].fields
        ).toEqual([101, 0, 1024, 10, 1]);
        expect(
            resolve("shape:i=ftgen(\n0,0,1024,10,1\n)").tables[0].fields
        ).toEqual([101, 0, 1024, 10, 1]);
    });
    it("links unique globals but ignores comments and multiline strings", () => {
        const text =
            "giWave ftgen 0,0,1024,10,1\na1 oscili .1,440,giWave\n; giWave\nS1 = {{\ngiFake ftgen 0,0,1024,10,1\n}}";
        const definitions = findTables(text, "piece.orc");
        expect(definitions).toHaveLength(1);
        expect(
            tableLinks(text, "piece.orc", definitions).map((l) =>
                text.slice(l.from, l.to)
            )
        ).toEqual(["giWave", "giWave"]);
    });
    it("does not reuse an overwritten source when its new parameters fail", () => {
        expect(() =>
            resolve(
                "giA ftgen 1,0,1024,10,1\ngiB ftgen 1,0,1024,10,p4\ngiC ftgen 2,0,1024,24,1,0,1"
            )
        ).toThrow(/source table 1/);
    });
    it("handles orchestra power precedence and rejects ambiguous score arithmetic", () => {
        expect(numberExpression("-2^2")).toBe(-4);
        expect(numberExpression("2^3^2")).toBe(64);
        expect(() => resolve("f1 0 [2^3*4] 10 1", "piece.sco")).toThrow(
            /parentheses/
        );
        expect(
            resolve("f1 0 [(2^3)*4] 10 1", "piece.sco").tables[0].fields[2]
        ).toBe(32);
    });
    it.each([
        ["8 / -2 / 2", -8],
        ["8 / +2 / 2", 8],
        ["8 / (-2) / 2", -2],
        ["8 / -2 * 2", -2],
        ["8 / -2^2 / 2", -4]
    ])("matches native Csound's unary precedence for %s", (text, expected) => {
        expect(numberExpression(text)).toBe(expected);
    });
});
