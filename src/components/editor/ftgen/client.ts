import type { TableRequest } from "./source";
declare const __CSOUND_FTGEN_URL__: string;
export const plotterAvailable =
    typeof __CSOUND_FTGEN_URL__ === "string" && Boolean(__CSOUND_FTGEN_URL__);

/** Owned by one open window; cancelled work cannot queue behind an expensive GEN. */
export class TableClient {
    private worker?: Worker;
    private cancel?: () => void;
    constructor(
        private readonly createWorker = () =>
            new Worker(new URL("./plot.worker.ts", import.meta.url), {
                type: "module"
            })
    ) {}
    generate(request: TableRequest): Promise<Float64Array> {
        if (this.cancel) this.dispose();
        return new Promise((resolve, reject) => {
            const finish = () => {
                clearTimeout(timer);
                this.cancel = undefined;
            };
            const fail = (error: Error) => {
                finish();
                this.worker?.terminate();
                this.worker = undefined;
                reject(error);
            };
            const timer = setTimeout(
                () =>
                    fail(
                        new Error(
                            "This table took too long to preview. Reduce its size or complexity."
                        )
                    ),
                5000
            );
            this.cancel = () =>
                fail(new DOMException("Preview cancelled", "AbortError"));
            try {
                this.worker ??= this.createWorker();
                this.worker.onmessage = ({
                    data
                }: MessageEvent<{
                    samples?: Float64Array;
                    error?: string;
                }>) => {
                    finish();
                    if (data.samples instanceof Float64Array)
                        resolve(data.samples);
                    else
                        reject(
                            new Error(data.error || "Table preview failed.")
                        );
                };
                this.worker.onerror = (event) => {
                    event.preventDefault();
                    fail(
                        new Error(
                            "This table could not be previewed. Check its GEN parameters."
                        )
                    );
                };
                this.worker.postMessage({
                    request,
                    url:
                        typeof __CSOUND_FTGEN_URL__ === "string"
                            ? __CSOUND_FTGEN_URL__
                            : ""
                });
            } catch {
                fail(new Error("Table preview is unavailable."));
            }
        });
    }
    cancelPending() {
        this.cancel?.();
    }
    dispose() {
        this.cancel?.();
        this.cancel = undefined;
        this.worker?.terminate();
        this.worker = undefined;
    }
}
