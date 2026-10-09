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
