import type { ToolMessage, ToolRequest, ToolResult } from "./types";

/** Load a command worker on demand and terminate it on completion, failure, or cancellation. */
export function runTool(
    request: ToolRequest,
    signal: AbortSignal,
    onStatus: (text: string) => void
): Promise<ToolResult> {
    return new Promise((resolve, reject) => {
        if (signal.aborted) {
            reject(new DOMException("Cancelled", "AbortError"));
            return;
        }
        // Create a worker only on Run. Termination also cancels synchronous WASM.
        const worker = new Worker(
            new URL("./tool.worker.ts", import.meta.url),
            {
                type: "module"
            }
        );
        const cleanup = () => {
            worker.terminate();
            signal.removeEventListener("abort", abort);
        };
        const abort = () => {
            cleanup();
            reject(new DOMException("Cancelled", "AbortError"));
        };
        signal.addEventListener("abort", abort, { once: true });
        worker.onmessage = ({ data }: MessageEvent<ToolMessage>) => {
            if (data.type === "status") onStatus(data.text);
            else {
                cleanup();
                if (data.type === "result") resolve(data.result);
                else reject(new Error(data.message));
            }
        };
        worker.onerror = () => {
            cleanup();
            reject(
                new Error(
                    "The audio worker stopped. Try a smaller file or retry."
                )
            );
        };
        worker.postMessage(request);
    });
}
