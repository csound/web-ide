import type { CsoundObj } from "./types";
import { loadScoreProgram } from "../score-tools/programs";
import { scoreSections, scoreProgramPath } from "./score-source";

// Only the IDE supplies built-ins. Csound runs commands from its filesystem,
// including uploaded WASI programs, without knowing about this registry.

export async function prepareScorePreprocessors(
    fs: Pick<CsoundObj["fs"], "readdir" | "writeFile">,
    source: string | undefined,
    signal: AbortSignal,
    projectPaths: string[] = []
): Promise<void> {
    if (!source) return;
    const commands = scoreSections(source)
        .filter((section) => section.closed)
        .map((section) => scoreProgramPath(section.command));
    for (const command of new Set(commands)) {
        const program = command.replace(/^(?:\.\/|\/)/, "");
        const name = program.replace(/\.wasm$/, "");
        // scsort/extract read stdin, so they do not implement CsScore's two-file contract.
        if (name !== "csbeats" && name !== "scot") continue;
        signal.throwIfAborted();
        const existing = new Set([...projectPaths, ...(await fs.readdir("/"))]);
        // Honor uploaded programs even if their download failed. A missing
        // project file should fail in Csound, not silently run our built-in.
        if (
            existing.has(program) ||
            (!program.endsWith(".wasm") && existing.has(`${program}.wasm`))
        )
            continue;
        const bytes = await loadScoreProgram(name, signal);
        signal.throwIfAborted();
        await fs.writeFile(`${name}.wasm`, bytes);
    }
}
