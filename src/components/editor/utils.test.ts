import { syntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { csoundMode } from "@hlolli/codemirror-lang-csound";
import { describe, expect, it } from "vitest";
import { findSurroundingContext } from "./utils";

const contextAt = (
    source: string,
    fileType: "csd" | "orc" | "sco",
    search: string
): string | undefined => {
    const state = EditorState.create({
        doc: source,
        extensions: [csoundMode({ fileType })]
    });
    const position = source.indexOf(search);
    if (position < 0) {
        throw new Error(`Search string not found in source: ${search}`);
    }
    const context = findSurroundingContext(
        syntaxTree(state).cursorAt(position, 1)
    );

    return context && source.slice(context.from, context.to);
};

describe("findSurroundingContext", () => {
    it("selects a whole instrument in an orchestra", () => {
        const source = [
            "instr 1",
            "a1 oscili 0.2, 440",
            "out a1",
            "endin",
            ""
        ].join("\n");

        expect(contextAt(source, "orc", "oscili")).toBe(source.trimEnd());
    });

    it("selects a whole legacy UDO", () => {
        const source = [
            "opcode PassThrough, a, a",
            "ain xin",
            "xout ain",
            "endop",
            ""
        ].join("\n");

        expect(contextAt(source, "orc", "xout")).toBe(source.trimEnd());
    });

    it("selects one top-level orchestra statement", () => {
        const source = ["giValue init 1", 'prints "ready"', ""].join("\n");

        expect(contextAt(source, "orc", "prints")).toBe('prints "ready"\n');
    });

    it("selects one score statement", () => {
        const source = ["f 1 0 1024 10 1", "i 1 0 1", ""].join("\n");

        expect(contextAt(source, "sco", "i 1")).toBe("i 1 0 1\n");
    });

    it("selects a whole instrument inside a CSD", () => {
        const instrument = [
            "instr 1",
            "a1 oscili 0.2, 440",
            "out a1",
            "endin"
        ].join("\n");
        const source = [
            "<CsoundSynthesizer>",
            "<CsInstruments>",
            instrument,
            "</CsInstruments>",
            "</CsoundSynthesizer>",
            ""
        ].join("\n");

        expect(contextAt(source, "csd", "oscili")).toBe(instrument);
    });
});
