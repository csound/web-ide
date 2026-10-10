export const scoreProgramLoaders = {
    csbeats: () => import("@csound/wasm-bin/lib/csbeats.wasm?url"),
    scot: () => import("@csound/wasm-bin/lib/scot.wasm?url"),
    scsort: () => import("@csound/wasm-bin/lib/scsort.wasm?url"),
    extract: () => import("@csound/wasm-bin/lib/extract.wasm?url")
};
export type ScoreProgram = keyof typeof scoreProgramLoaders;
const binaries = new Map<ScoreProgram, Uint8Array<ArrayBuffer>>();

export function isScoreProgram(name: string): name is ScoreProgram {
    return Object.hasOwn(scoreProgramLoaders, name);
}

/** Import a URL and fetch bytes only when this program is requested. */
export async function loadScoreProgram(
    name: ScoreProgram,
    signal?: AbortSignal
) {
    signal?.throwIfAborted();
    const cached = binaries.get(name);
    if (cached) return cached;
    const { default: url } = await scoreProgramLoaders[name]();
    signal?.throwIfAborted();
    const response = await fetch(url, { signal });
    if (!response.ok)
        throw new Error(
            `Could not load ${name} (${response.status}). Try again.`
        );
    const bytes = new Uint8Array(await response.arrayBuffer());
    signal?.throwIfAborted();
    binaries.set(name, bytes);
    return bytes;
}
