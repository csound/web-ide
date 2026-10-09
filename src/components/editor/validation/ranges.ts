import type { Text } from "@codemirror/state";
import type { Diagnostic } from "@codemirror/lint";
import type { SourceDiagnostic } from "./types";

// Csound counts UTF-8 bytes; CodeMirror uses UTF-16 offsets. Round outwards
// if a reported range ends inside a character, and never cross a line boundary.
function byteOffset(text: string, target: number, end = false): number {
    let bytes = 0;
    let offset = 0;
    for (const character of text) {
        if (bytes >= target) break;
        const code = character.codePointAt(0)!;
        bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
        if (bytes > target && !end) break;
        offset += character.length;
    }
    return offset;
}

function tokenRange(text: string, message: string, column: number) {
    const token =
        /\(token "(.*)"\)$/.exec(message)?.[1] ||
        /unable to find opcode with name:\s*(\S+)$/i.exec(message)?.[1] ||
        /unable to find opcode entry for '([^']+)'/i.exec(message)?.[1];
    if (!token?.trim()) return;
    // Function calls, strings and macros can shift Csound's lexer columns.
    // Match its reported token nearest the column in the user's source.
    let closest: number | undefined;
    let distance = Infinity;
    for (
        let index = text.indexOf(token);
        index !== -1;
        index = text.indexOf(token, index + token.length)
    ) {
        const nextDistance = Math.abs(index - column);
        if (nextDistance < distance) {
            closest = index;
            distance = nextDistance;
        } else if (nextDistance === distance) {
            closest = undefined;
        }
    }
    return closest === undefined
        ? undefined
        : { from: closest, to: closest + token.length };
}

/** Use the same ranges for background checks and errors from Play/Render. */
export function editorDiagnostics(
    doc: Text,
    diagnostics: SourceDiagnostic[]
): Diagnostic[] {
    return diagnostics
        .filter((item) => item.line > 0 && item.line <= doc.lines)
        .map((item) => {
            const line = doc.line(item.line);
            const hasColumn = Boolean(
                item.column &&
                    item.column > 0 &&
                    (item.endColumn ?? item.column) >= item.column
            );
            const from = hasColumn
                ? byteOffset(line.text, item.column! - 1)
                : 0;
            const to = hasColumn
                ? byteOffset(line.text, item.endColumn ?? item.column!, true)
                : line.length;
            const range = hasColumn
                ? tokenRange(line.text, item.message, from)
                : undefined;
            return {
                from: line.from + (range?.from ?? from),
                to: line.from + (range?.to ?? to),
                severity: "error",
                message: item.message,
                ...(hasColumn ? {} : { markClass: "cm-lintLine-error" })
            };
        });
}
