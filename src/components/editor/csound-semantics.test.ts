import { expect, it } from "vitest";
import { analyzeEditorLine } from "./csound-semantics";

it.each([
    "opcode localGain(value:i):i\n xout value\nendop",
    "opcode localGain, i, i\n ivalue xin\n xout ivalue\nendop",
    "declare localGain(value:i):i"
])("recognizes mixed bundled and document UDO calls with %s", (header) => {
    const line = "a1 STKMandolin 220, localGain(0.2)";
    const documentText = `${header}\ninstr 1\n${line}\nendin`;
    const offset = documentText.indexOf(line);
    // Even a confirmed catalog can lack a newly typed UDO.
    for (const userOpcodeSignatures of [undefined, new Map()]) {
        const spans = analyzeEditorLine(line, {
            documentText,
            offset,
            userOpcodeSignatures
        });
        expect(
            spans
                .filter((span) => span.kind === "userOpcode")
                .map((span) => documentText.slice(span.from, span.to))
        ).toEqual(["STKMandolin", "localGain"]);
        expect(spans.find((span) => span.kind === "output")).toMatchObject({
            from: offset,
            to: offset + 2
        });
    }
});

it("uses local overloads instead of bundled signatures with the same name", () => {
    const line = "a1, k1 STKMandolin 1";
    const documentText = `opcode STKMandolin(value:i):(a,k)\nendop\n${line}`;
    const spans = analyzeEditorLine(line, { documentText });
    expect(
        spans
            .filter((span) => span.kind === "output")
            .map((span) => line.slice(span.from, span.to))
    ).toEqual(["a1", "k1"]);
});

it("keeps supplied project UDOs alongside document and bundled calls", () => {
    const line = "a1 STKMandolin fromInclude(220), localGain(0.2)";
    const documentText = `opcode localGain(value:i):i\nendop\n${line}`;
    const spans = analyzeEditorLine(line, {
        documentText,
        userOpcodeSignatures: new Map([
            ["fromInclude", [{ inTypes: "i", outTypes: "i" }]]
        ])
    });
    expect(
        spans
            .filter((span) => span.kind === "userOpcode")
            .map((span) => line.slice(span.from, span.to))
    ).toEqual(["STKMandolin", "fromInclude", "localGain"]);
});

it("does not discover UDO declarations inside comments or strings", () => {
    const line = "a1 STKMandolin 220, 0.2";
    const documentText = `/*\nopcode STKMandolin(value:i):(a,k)\nendop\n*/\nStext = {{\nopcode STKMandolin(value:i):(a,k)\nendop\n}}\n${line}`;
    const spans = analyzeEditorLine(line, { documentText });
    expect(
        spans
            .filter((span) => span.kind === "userOpcode")
            .map((span) => line.slice(span.from, span.to))
    ).toEqual(["STKMandolin"]);
    expect(
        spans
            .filter((span) => span.kind === "output")
            .map((span) => line.slice(span.from, span.to))
    ).toEqual(["a1"]);
});

it("preserves array and void UDO signatures in CSD documents", () => {
    const header =
        "opcode localArray(values:i[]):(i[],k)\nendop\nopcode localPrint(value:i):void\nendop";
    const lines = [
        "ivalues[], kcount localArray iSource",
        "localPrint imagecreate(2, 3)"
    ];
    const documentText = `<CsoundSynthesizer>\n<CsInstruments>\n${header}\ninstr 1\n${lines.join("\n")}\nendin\n</CsInstruments>\n</CsoundSynthesizer>`;
    const first = analyzeEditorLine(lines[0], { documentText });
    expect(
        first
            .filter((span) => span.kind === "output")
            .map((span) => lines[0].slice(span.from, span.to))
    ).toEqual(["ivalues[]", "kcount"]);
    const second = analyzeEditorLine(lines[1], { documentText });
    expect(
        second
            .filter((span) => span.kind === "userOpcode")
            .map((span) => lines[1].slice(span.from, span.to))
    ).toEqual(["localPrint", "imagecreate"]);
});

it("updates discovered UDOs after editing a document", () => {
    const line = "a1, k1 STKMandolin 1";
    const documentText = `opcode STKMandolin(value:i):(a,k)\nendop\n${line}`;
    expect(
        analyzeEditorLine(line, { documentText }).filter(
            (span) => span.kind === "output"
        )
    ).toHaveLength(2);
    const updated = "a1 STKMandolin 220, 0.2";
    expect(
        analyzeEditorLine(updated, { documentText: updated }).filter(
            (span) => span.kind === "output"
        )
    ).toHaveLength(1);
});
