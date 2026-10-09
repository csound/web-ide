import { version } from "@csound/browser/package.json";
import { probePlugins } from "./client";
import { MAX_PLUGIN_BYTES } from "./signatures";
import { emptyMetadata, type PluginMetadata } from "./types";

export interface PluginFile {
    name: string;
    revision: string;
    load: (signal: AbortSignal) => Promise<Uint8Array>;
}

function remember<T>(map: Map<string, T>, key: string, value: T) {
    map.delete(key);
    map.set(key, value);
    while (map.size > 8) map.delete(map.keys().next().value!);
}

function bounded<T>(task: Promise<T>, signal: AbortSignal): Promise<T> {
    return new Promise((resolve, reject) => {
        const abort = () => reject(new Error("Plugin file read timed out"));
        signal.addEventListener("abort", abort, { once: true });
        if (signal.aborted) abort();
        void task
            .then(resolve, reject)
            .finally(() => signal.removeEventListener("abort", abort));
    });
}

/** Cache only small signatures, never plugin runtimes or binary buffers.
 * File revisions avoid repeat downloads. Content hashes let renamed files
 * reuse inspection, and the runtime version keeps signatures ABI-specific. */
export class PluginMetadataCache {
    private revisions = new Map<string, PluginMetadata>();
    private contents = new Map<string, PluginMetadata>();
    private pending = new Map<string, Promise<PluginMetadata>>();
    private failures = new Map<string, number>();
    private tail: Promise<unknown> = Promise.resolve();

    constructor(private inspect = probePlugins) {}

    get(projectUid: string, files: PluginFile[]): Promise<PluginMetadata> {
        if (!files.length) return Promise.resolve(emptyMetadata());
        if (files.length > 16)
            return Promise.reject(new Error("Too many opcode plugins"));
        const key = JSON.stringify([
            version,
            projectUid,
            files.map(({ name, revision }) => [name, revision])
        ]);
        const cached = this.revisions.get(key);
        if (cached) {
            remember(this.revisions, key, cached);
            return Promise.resolve(cached);
        }
        const pending = this.pending.get(key);
        if (pending) return pending;
        if ((this.failures.get(key) ?? 0) > Date.now())
            return Promise.reject(
                new Error("Plugin inspection recently failed")
            );
        if (this.pending.size >= 4)
            return Promise.reject(new Error("Plugin inspection is busy"));
        // One runtime at a time. Edits can stop waiting, while the short bounded
        // probe finishes and fills the cache for the next debounced check.
        const result = this.tail.then(async () => {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 20000);
            try {
                const binaries: Uint8Array[] = [];
                let size = 0;
                const hashes: string[] = [];
                for (const file of files) {
                    controller.signal.throwIfAborted();
                    const bytes = await bounded(
                        file.load(controller.signal),
                        controller.signal
                    );
                    controller.signal.throwIfAborted();
                    size += bytes.length;
                    if (size > MAX_PLUGIN_BYTES)
                        throw new Error("Plugin set is too large");
                    binaries.push(bytes);
                    const hash = await crypto.subtle.digest(
                        "SHA-256",
                        Uint8Array.from(bytes)
                    );
                    hashes.push(
                        Array.from(new Uint8Array(hash), (byte) =>
                            byte.toString(16).padStart(2, "0")
                        ).join("")
                    );
                }
                const contentKey = JSON.stringify([
                    version,
                    projectUid,
                    hashes
                ]);
                let signatures = this.contents.get(contentKey);
                if (!signatures)
                    signatures = await this.inspect(
                        binaries,
                        controller.signal
                    );
                remember(this.contents, contentKey, signatures);
                remember(this.revisions, key, signatures);
                return signatures;
            } catch (error) {
                remember(this.failures, key, Date.now() + 30000);
                throw error;
            } finally {
                clearTimeout(timer);
            }
        });
        this.pending.set(key, result);
        this.tail = result.catch(() => {});
        void result.finally(() => this.pending.delete(key)).catch(() => {});
        return result;
    }
}

export const pluginMetadata = new PluginMetadataCache();
