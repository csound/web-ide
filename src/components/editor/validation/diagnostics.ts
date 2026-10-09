import type { SourceDiagnostic } from "./types";

/** Only mark errors that Csound locates. Never guess a line from an unlocated failure. */
export function readDiagnostics(
    log: string,
    filename: string,
    files: string[] = [filename],
    stringSource = false
): SourceDiagnostic[] {
    const diagnostics: SourceDiagnostic[] = [];
    let last: SourceDiagnostic | undefined;
    let foundFile = false;
    let context = "";
    for (const line of log.split(/\r?\n/)) {
        const location =
            /\bline\s+(\d+)\b(?:,?\s+columns?\s+(\d+)(?:\s*[,-]\s*(\d+))?)?/.exec(
                line
            );
        const file = /^from file (.+?)(?: \(\d+\))?$/.exec(line);
        if (location && !/Parsing failed|Stopping on/.test(line)) {
            last = {
                filename,
                line: Number(location[1]),
                ...(location[2] && {
                    column: Number(location[2]),
                    endColumn: Number(location[3] || location[2])
                }),
                message: (context + " " + line.replace(location[0], ""))
                    .trim()
                    .replace(/^error:\s*/i, "")
                    .replace(/(?:,\s*|\s+on\s*):?$/, "")
            };
            diagnostics.push(last);
            foundFile = false;
            context = "";
        } else if (file && last && !foundFile) {
            const name = file[1].replace(/^(?:\.\/|\/)/, "");
            const matches = files.filter(
                (path) => path === name || path.endsWith(`/${name}`)
            );
            // Csound can report an include's basename rather than its full path.
            // Keep ambiguous locations out of the gutter instead of marking another file.
            last.filename =
                name === filename || (stringSource && name === "*string*")
                    ? filename
                    : matches.length === 1
                      ? matches[0]
                      : "";
            foundFile = true;
        } else if (
            /^error:|Unable to find|used before|syntax error/i.test(line.trim())
        ) {
            context = line.trim();
        }
    }
    return diagnostics
        .filter(
            (item, index, all) =>
                Boolean(item.filename) &&
                item.line > 0 &&
                all.findIndex(
                    (other) =>
                        other.filename === item.filename &&
                        other.line === item.line
                ) === index
        )
        .slice(0, 20);
}
