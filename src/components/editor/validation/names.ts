import type { SourceDiagnostic, SourceFile } from "./types";

export interface UnknownCall {
    kind: "unknownCall";
    name: string;
    filename: string;
    line: number;
    column: number;
}

const encoder = new TextEncoder();

/** The lexer supplies candidates, not errors. Require a matching call in the
 * source before marking it; macro expansions can change both text and columns. */
export function addUnknownCalls(
    diagnostics: SourceDiagnostic[],
    calls: UnknownCall[],
    files: SourceFile[],
    known: Set<string>
): SourceDiagnostic[] {
    if (!calls.length) return diagnostics;
    const result = [...diagnostics];
    const sources = new Map(files.map((file) => [file.name, file.text]));
    const lines = new Map<string, string[]>();
    for (const call of calls) {
        if (result.length >= 20) break;
        if (known.has(call.name) || !/^[A-Za-z_]\w*$/.test(call.name)) continue;
        if (!lines.has(call.filename))
            lines.set(
                call.filename,
                sources.get(call.filename)?.split("\n") ?? []
            );
        const line = lines.get(call.filename)?.[call.line - 1];
        if (line === undefined) continue;
        // Only explicit function syntax is unambiguous without type checking.
        // Member calls can refer to opcode objects and need scope information.
        const pattern = new RegExp(
            `\\b${call.name}(?::[\\w]+(?:\\[\\])*)?\\(`,
            "g"
        );
        let column: number | undefined;
        let distance = Infinity;
        for (const match of line.matchAll(pattern)) {
            const prefix = line.slice(0, match.index);
            if (prefix.trimEnd().endsWith(".")) continue;
            const start = encoder.encode(prefix).length + 1;
            const delta = Math.abs(start - call.column);
            if (delta < distance) {
                column = start;
                distance = delta;
            } else if (delta === distance) column = undefined;
        }
        if (column === undefined) continue;
        const message = `Unknown opcode: ${call.name}`;
        if (
            result.some(
                (item) =>
                    item.filename === call.filename &&
                    item.line === call.line &&
                    ((item.message === message && item.column === column) ||
                        /unable to find opcode with name:\s*(\S+)$/i.exec(
                            item.message
                        )?.[1] === call.name)
            )
        )
            continue;
        result.push({
            filename: call.filename,
            line: call.line,
            column,
            endColumn: column + call.name.length - 1,
            message
        });
    }
    return result;
}
