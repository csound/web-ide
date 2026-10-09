import type { IDocument } from "../../projects/types";
import type { CheckRequest } from "./types";
import { requestedPlugins } from "./plugins/options";

export const MAX_SOURCE_BYTES = 2 * 1024 * 1024;

/** Keep original CSD line numbers; never execute CsOptions or score preprocessors. */
export function orchestra(text: string, filename: string): string | undefined {
    if (!/\.csd$/i.test(filename)) return text;
    const section = /<CsInstruments\s*>([\s\S]*?)<\/CsInstruments\s*>/i.exec(
        text
    );
    if (!section) return undefined;
    const start = section.index + section[0].indexOf(">") + 1;
    return (
        "\n".repeat((text.slice(0, start).match(/\n/g) || []).length) +
        section[1]
    );
}

export function projectSources(
    documents: Record<string, IDocument>,
    documentUid: string,
    text: string
): CheckRequest | undefined {
    const current = documents[documentUid];
    if (!current || !/\.(csd|orc)$/i.test(current.filename)) return;
    const filename = [
        ...current.path.map((id) => documents[id]?.filename || id),
        current.filename
    ].join("/");
    const files = Object.values(documents)
        .filter((document) => document.type === "txt")
        .map((document) => ({
            name: [
                ...document.path.map((id) => documents[id]?.filename || id),
                document.filename
            ].join("/"),
            text:
                document.documentUid === documentUid
                    ? text
                    : document.currentValue
        }));
    const source = orchestra(text, filename);
    if (source === undefined) {
        const opening = /<CsInstruments\s*>/i.exec(text);
        if (!opening) return;
        return {
            filename,
            files: [],
            sourceDiagnostics: [
                {
                    filename,
                    line:
                        (text.slice(0, opening.index).match(/\n/g) || [])
                            .length + 1,
                    message: "Missing </CsInstruments>"
                }
            ]
        };
    }
    const entry = files.find((file) => file.name === filename);
    if (!entry) return;
    entry.text = source;
    // A string-length bound avoids copying an arbitrarily large project. The
    // worker also checks UTF-8 byte size before creating its filesystem.
    if (
        files.reduce((size, file) => size + file.text.length, 0) >
        MAX_SOURCE_BYTES
    )
        return;
    return { filename, files, pluginRequests: requestedPlugins(text) };
}
