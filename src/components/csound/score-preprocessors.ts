import type { CsoundObj } from "./types";

// Only the IDE supplies built-ins. Csound runs commands from its filesystem,
// including uploaded WASI programs, without knowing about this registry.
const bundled = new Map([
    ["csbeats", () => import("@csound/wasm-bin/lib/csbeats.wasm?url")]
]);
const binaries = new Map<string, Uint8Array>();

function scoreCommands(source: string): string[] {
    // CSD is not XML: orchestra code may contain comparisons and tag strings.
    // Ignore its body and other non-score sections before inspecting score tags.
    const scores = source
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(
            /^[\t ]*<(CsInstruments|CsOptions|CsFileB|CsLicense|CsLicence)\b[^>]*>[\s\S]*?^[\t ]*<\/\1>/gm,
            ""
        );
    return [
        ...scores.matchAll(
            /^[\t ]*<CsScore\b([^>\r\n]*)>[\s\S]*?^[\t ]*<\/CsScore>/gm
        )
    ]
        .map((match) => match[1].match(/\bbin="([^"]+)"/)?.[1].trim() ?? "")
        .map(
            (command) =>
                command
                    .match(/^(?:'([^']+)'|([^\s]+))/)
                    ?.slice(1)
                    .find(Boolean) ?? ""
        );
}

export async function prepareScorePreprocessors(
    fs: Pick<CsoundObj["fs"], "readdir" | "writeFile">,
    source: string | undefined,
    signal: AbortSignal,
    projectPaths: string[] = []
): Promise<void> {
    if (!source) return;
    for (const command of new Set(scoreCommands(source))) {
        const program = command.replace(/^(?:\.\/|\/)/, "");
        const name = program.replace(/\.wasm$/, "");
        const load = bundled.get(name);
        if (!load) continue;
        signal.throwIfAborted();
        const existing = new Set([...projectPaths, ...(await fs.readdir("/"))]);
        // Honor uploaded programs even if their download failed. A missing
        // project file should fail in Csound, not silently run our built-in.
        if (
            existing.has(program) ||
            (!program.endsWith(".wasm") && existing.has(`${program}.wasm`))
        )
            continue;
        let bytes = binaries.get(name);
        if (!bytes) {
            const { default: url } = await load();
            signal.throwIfAborted();
            const response = await fetch(url, { signal });
            if (!response.ok)
                throw new Error(
                    `Could not load ${name} (${response.status}). Try again.`
                );
            bytes = new Uint8Array(await response.arrayBuffer());
            signal.throwIfAborted();
            binaries.set(name, bytes);
        }
        signal.throwIfAborted();
        await fs.writeFile(`${name}.wasm`, bytes);
    }
}
