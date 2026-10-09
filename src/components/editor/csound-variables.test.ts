import { expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { csound } from "@kunstmusik/codemirror-lang-csound";
import { csoundVariables } from "./csound-variables";

it("suggests declared variables in the current scope, including modern names", () => {
    const doc =
        "giGain = 0.3\ninstr Other\nkPrivate init 1\nendin\ninstr Lead\nfrequency:i = 440\naSignal oscili giGain, frequency\n; kComment init 0\nout aSignal\nendin";
    const state = EditorState.create({
        doc,
        extensions: csound({ mode: "orc" })
    });
    const results = csoundVariables(state, doc.indexOf("out aSignal") + 5);
    expect(results.map((item) => item.label)).toEqual(
        expect.arrayContaining(["giGain", "frequency", "aSignal"])
    );
    expect(results.map((item) => item.label)).not.toEqual(
        expect.arrayContaining(["kPrivate"])
    );
    expect(
        results.some((item) => ["kComment", "oscili"].includes(item.label))
    ).toBe(false);
});

it("keeps typed gain and gate local while preserving explicit and legacy globals", () => {
    const doc = `giGain = 0.3
instr First
gain:k = 1
gate:i = 1
shared@global:k = 1
print gate
endin
instr Second
print giGain
endin
opcode Third():i
xout giGain
endop
`;
    const state = EditorState.create({
        doc,
        extensions: csound({ mode: "orc" })
    });
    const labelsAt = (text: string) =>
        csoundVariables(state, doc.indexOf(text)).map((item) => item.label);
    expect(labelsAt("print gate")).toEqual(
        expect.arrayContaining(["gain", "gate"])
    );
    for (const location of ["print giGain", "xout giGain"]) {
        const labels = labelsAt(location);
        expect(labels).toEqual(expect.arrayContaining(["giGain", "shared"]));
        expect(labels).not.toContain("gain");
        expect(labels).not.toContain("gate");
    }
});
