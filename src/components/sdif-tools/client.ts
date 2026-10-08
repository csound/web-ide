import type { ToolFile } from "../audio-tools/types";
import type { SdifRequest, convertSdif } from "./convert";
import type { StreamInfo } from "./format";
export type Request =
    | { kind: "inspect"; file: ToolFile }
    | { kind: "convert"; request: SdifRequest };
function execute<Value>(
    request: Request,
    signal: AbortSignal,
    status: (text: string) => void
): Promise<Value> {
    return new Promise((resolve, reject) => {
        if (signal.aborted) {
            reject(new DOMException("Cancelled", "AbortError"));
            return;
        }
        const worker = new Worker(
            new URL("./conversion.worker.ts", import.meta.url),
            { type: "module" }
        );
        const cleanup = () => {
            worker.onmessage = null;
            worker.onerror = null;
            worker.terminate();
            signal.removeEventListener("abort", abort);
        };
        const abort = () => {
            cleanup();
            reject(new DOMException("Cancelled", "AbortError"));
        };
        signal.addEventListener("abort", abort, { once: true });
        worker.onmessage = ({ data }) => {
            if (data.type === "status") status(data.text);
            else {
                cleanup();
                if (data.type === "result") resolve(data.value);
                else reject(new Error(data.message));
            }
        };
        worker.onerror = () => {
            cleanup();
            reject(
                new Error(
                    "The SDIF converter stopped. Try a shorter range or retry."
                )
            );
        };
        worker.postMessage(request);
    });
}
export const inspectFile = (
    file: ToolFile,
    signal: AbortSignal,
    status: (text: string) => void
) => execute<StreamInfo[]>({ kind: "inspect", file }, signal, status);
export const updateSdif = (
    request: SdifRequest,
    signal: AbortSignal,
    status: (text: string) => void
) =>
    execute<Awaited<ReturnType<typeof convertSdif>>>(
        { kind: "convert", request },
        signal,
        status
    );
