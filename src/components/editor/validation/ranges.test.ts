import { expect, it } from "vitest";
import { Text } from "@codemirror/state";
import { editorDiagnostics } from "./ranges";

it("maps inclusive byte columns to a token range after a tab and Unicode", () => {
    const doc = Text.of(["instr 1", "\tö😀 invalid", "endin"]);
    const [diagnostic] = editorDiagnostics(doc, [
        {
            filename: "main.orc",
            line: 2,
            column: 9,
            endColumn: 15,
            message: "Syntax error"
        }
    ]);
    expect(doc.sliceString(diagnostic.from, diagnostic.to)).toBe("invalid");
    expect(diagnostic.source).toBeUndefined();
});

it("uses the nearest reported token when lexer columns drift", () => {
    const doc = Text.of([
        "instr 1",
        "a1 = oscili(0.1, 440) + oscili(0.1, )",
        "endin"
    ]);
    const [diagnostic] = editorDiagnostics(doc, [
        {
            filename: "main.orc",
            line: 2,
            column: 38,
            endColumn: 38,
            message: "syntax error, unexpected ')' (token \")\")"
        }
    ]);
    expect(diagnostic.from).toBe(doc.line(2).to - 1);
    expect(doc.sliceString(diagnostic.from, diagnostic.to)).toBe(")");
});

it("bounds invalid columns to the line and leaves line-only errors subtle", () => {
    const doc = Text.of(["instr 1", "a1 =", "endin"]);
    const diagnostics = editorDiagnostics(doc, [
        { filename: "main.orc", line: 1, message: "Line error" },
        {
            filename: "main.orc",
            line: 2,
            column: 999,
            endColumn: 1000,
            message: "End of line error"
        },
        { filename: "main.orc", line: 10, message: "Outside the document" }
    ]);
    expect(diagnostics).toEqual([
        {
            from: 0,
            to: 7,
            severity: "error",
            message: "Line error",
            markClass: "cm-lintLine-error"
        },
        {
            from: 12,
            to: 12,
            severity: "error",
            message: "End of line error"
        }
    ]);
});
