import { validateMetadata, type PluginMetadata } from "./types";

/** A stuck module constructor must not block either the editor or its checker. */
export function probePlugins(
    binaries: Uint8Array[],
    signal: AbortSignal,
    createWorker = () =>
        new Worker(new URL("./metadata.worker.ts", import.meta.url), {
            type: "module"
        })
): Promise<PluginMetadata> {
    signal.throwIfAborted();
    return new Promise((resolve, reject) => {
        const worker = createWorker();
        let finished = false;
        const finish = (error?: Error, result?: PluginMetadata) => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            signal.removeEventListener("abort", abort);
            worker.terminate();
            if (error) reject(error);
            else resolve(result!);
        };
        const abort = () => finish(new Error("Plugin inspection cancelled"));
        const timer = setTimeout(
            () => finish(new Error("Plugin inspection timed out")),
            8000
        );
        signal.addEventListener("abort", abort, { once: true });
        worker.onerror = () => {
            finish(new Error("Plugin inspection failed"));
        };
        worker.onmessage = ({ data }) => {
            try {
                if (data.error) throw new Error("Plugin inspection failed");
                finish(undefined, validateMetadata(data.metadata));
            } catch {
                finish(new Error("Invalid plugin metadata"));
            }
        };
        try {
            const copies = binaries.map((bytes) => Uint8Array.from(bytes));
            worker.postMessage(
                copies,
                copies.map((bytes) => bytes.buffer)
            );
        } catch {
            finish(new Error("Could not start plugin inspection"));
        }
    });
}
