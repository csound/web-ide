import { expect, it } from "vitest";
import { readDiagnostics } from "./diagnostics";

it.each(["25,25", "25-25"])(
    "keeps columns %s separate from the hover message",
    (columns) => {
        expect(
            readDiagnostics(
                `syntax error, unexpected ')' (token ")"),  line 11, columns ${columns}\nfrom file main.csd (1)`,
                "main.csd"
            )
        ).toEqual([
            {
                filename: "main.csd",
                line: 11,
                column: 25,
                endColumn: 25,
                message: "syntax error, unexpected ')' (token \")\")"
            }
        ]);
    }
);

it("joins a split error message without its location suffix", () => {
    expect(
        readDiagnostics(
            "error: Unable to find opcode entry for 'oscili'\n  with matching argument types, line 2 columns 6-12\nfrom file main.orc (1)",
            "main.orc"
        )
    ).toEqual([
        expect.objectContaining({
            line: 2,
            column: 6,
            endColumn: 12,
            message:
                "Unable to find opcode entry for 'oscili'   with matching argument types"
        })
    ]);
});

it("does not guess which include owns an ambiguous filename", () => {
    const log =
        "syntax error, line 2\nfrom file voice.udo (2)\nfrom file main.csd (1)";
    expect(
        readDiagnostics(log, "main.csd", [
            "main.csd",
            "voice.udo",
            "parts/voice.udo"
        ])
    ).toEqual([]);
    expect(
        readDiagnostics(log, "main.csd", ["main.csd", "parts/voice.udo"])
    ).toEqual([
        expect.objectContaining({ filename: "parts/voice.udo", line: 2 })
    ]);
});

it("maps only a known ORC string source to its document and keeps include locations", () => {
    const log =
        "syntax error, line 2\nfrom file *string* (1)\nsyntax error, line 3\nfrom file voice.udo (2)\nfrom file *string* (1)";
    const files = ["scores/main.orc", "scores/voice.udo"];
    expect(
        readDiagnostics(log, files[0], files, true).map(
            ({ filename, line }) => ({ filename, line })
        )
    ).toEqual([
        { filename: files[0], line: 2 },
        { filename: files[1], line: 3 }
    ]);
    expect(
        readDiagnostics(log, files[0], files).map((item) => item.filename)
    ).toEqual([files[1]]);
});
