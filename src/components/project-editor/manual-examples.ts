import type { TemporaryDocument } from "./temporary-documents";

/** Accept only files shipped with the same-origin manual. */
export function manualExampleUrl(
    value: unknown,
    origin = location.origin
): URL {
    if (typeof value !== "string")
        throw new Error("Invalid manual example link.");
    const url = new URL(value, origin);
    const path = decodeURIComponent(url.pathname);
    if (
        url.origin !== origin ||
        !path.startsWith("/manual/examples/") ||
        path.includes("\\") ||
        path.split("/").some((part) => part === "..") ||
        url.search ||
        url.hash
    )
        throw new Error("Invalid manual example link.");
    return url;
}

export async function loadManualExample(
    value: unknown,
    assets: unknown,
    signal: AbortSignal
): Promise<TemporaryDocument> {
    const url = manualExampleUrl(value);
    if (!/\.csd$/i.test(url.pathname)) throw new Error("Choose a CSD example.");
    const response = await fetch(url, { signal });
    if (!response.ok)
        throw new Error("Could not open the example. Please try again.");
    const source = await response.text();
    if (!/<CsoundSynthesizer\b/i.test(source))
        throw new Error("This link does not contain a Csound example.");
    return {
        filename: decodeURIComponent(url.pathname.split("/").pop()!),
        value: source,
        source: {
            kind: "manual-example",
            url: url.href,
            assets: Array.isArray(assets)
                ? [
                      ...new Set(
                          assets.map((asset) => manualExampleUrl(asset).href)
                      )
                  ]
                : []
        }
    };
}

/** Find literal filenames without treating commented examples as dependencies. */
function referencedFiles(source: string): Set<string> {
    const tokens = source.matchAll(
        /"((?:\\.|[^"\\])*)"|;[^\r\n]*|\/\/[^\r\n]*|\/\*[\s\S]*?\*\//g
    );
    return new Set(
        [...tokens].flatMap((match) =>
            match[1] ? [match[1].replace(/^(?:\.\/)+/, "")] : []
        )
    );
}

/** Resolve edited source against the files shipped with the manual. */
async function referencedAssets(source: string, signal: AbortSignal) {
    const files = referencedFiles(source);
    if (files.size === 0) return [];
    const response = await fetch("/manual/example-assets.json", { signal });
    if (!response.ok)
        throw new Error("Could not load the manual sample index.");
    const index: unknown = await response.json();
    if (
        !Array.isArray(index) ||
        !index.every(
            (name) =>
                typeof name === "string" &&
                name !== "." &&
                name !== ".." &&
                /^[^/\\\0]+$/.test(name)
        )
    )
        throw new Error("Invalid manual sample index.");
    return index
        .filter((name) => files.has(name))
        .map((name) => `/manual/examples/${encodeURIComponent(name)}`);
}

/** Sample files stay in the Csound filesystem for this performance only. */
export async function loadManualExampleAssets(
    document: TemporaryDocument,
    signal: AbortSignal
) {
    if (!document.source) return [];
    const assets = new Set(
        [
            ...document.source.assets,
            ...(await referencedAssets(document.value, signal))
        ].map((asset) => manualExampleUrl(asset).href)
    );
    return Promise.all(
        [...assets].map(async (asset) => {
            const url = manualExampleUrl(asset);
            const response = await fetch(url, { signal });
            if (!response.ok)
                throw new Error(
                    `Could not load ${url.pathname.split("/").pop()}.`
                );
            return {
                name: decodeURIComponent(url.pathname.split("/").pop()!),
                data: new Uint8Array(await response.arrayBuffer())
            };
        })
    );
}
