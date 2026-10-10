import type { CheckRequest, CheckResult } from "./types";

declare const __CSOUND_CHECK_URL__: string;
export const checkerAvailable =
    typeof __CSOUND_CHECK_URL__ === "string" && Boolean(__CSOUND_CHECK_URL__);
const unavailable: CheckResult = { available: false, diagnostics: [] };

/** One worker for the editor. Keep at most one running and one pending request. */
export class CheckerClient {
    private worker?: Worker;
    private running?: {
        resolve: (result: CheckResult) => void;
        timer: ReturnType<typeof setTimeout>;
    };
    private pending?: {
        request: CheckRequest;
        resolve: (result: CheckResult) => void;
        signal: AbortSignal;
    };
    private disabled = false;
    private idle?: ReturnType<typeof setTimeout>;

    constructor(
        private readonly createWorker: () => Worker = () =>
            new Worker(new URL("./check.worker.ts", import.meta.url), {
                type: "module"
            })
    ) {}

    check(request: CheckRequest, signal: AbortSignal): Promise<CheckResult> {
        if (this.disabled || signal.aborted)
            return Promise.resolve(unavailable);
        clearTimeout(this.idle);
        this.pending?.resolve(unavailable);
        return new Promise((resolve) => {
            this.pending = { request, resolve, signal };
            this.next();
        });
    }

    private next() {
        if (this.running || !this.pending) return;
        const { request, resolve, signal } = this.pending;
        this.pending = undefined;
        if (signal.aborted) {
            resolve(unavailable);
            return;
        }
        try {
            this.worker ??= this.createWorker();
            this.worker.onmessage = ({ data }: MessageEvent<CheckResult>) =>
                this.finish(data);
            this.worker.onerror = () => this.fail();
            this.running = {
                resolve,
                timer: setTimeout(() => this.fail(), 5000)
            };
            this.worker.postMessage({
                ...request,
                url:
                    typeof __CSOUND_CHECK_URL__ === "string"
                        ? __CSOUND_CHECK_URL__
                        : ""
            });
        } catch {
            this.fail();
            resolve(unavailable);
        }
    }

    private finish(result: CheckResult) {
        if (!result.available && !result.rejected) {
            this.fail();
            return;
        }
        clearTimeout(this.running?.timer);
        this.running?.resolve(result);
        this.running = undefined;
        this.next();
        if (!this.running) this.idle = setTimeout(() => this.dispose(), 60000);
    }

    private fail() {
        this.disabled = true;
        this.dispose();
    }

    dispose() {
        clearTimeout(this.idle);
        clearTimeout(this.running?.timer);
        this.running?.resolve(unavailable);
        this.pending?.resolve(unavailable);
        this.running = this.pending = undefined;
        this.worker?.terminate();
        this.worker = undefined;
    }
}

export const checker = new CheckerClient();
