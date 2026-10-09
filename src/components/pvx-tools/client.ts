import type { ToolFile } from "../audio-tools/types";
import type { convertPvx, PvxEdit } from "./convert";
export type ConversionRequest =
    | { kind: "open"; file: ToolFile }
    | { kind: "convert"; edit: PvxEdit };
type Converted = Awaited<ReturnType<typeof convertPvx>>;
function execute<Value>(
    request: ConversionRequest,
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
                    "The PVX converter stopped. Try a shorter analysis or retry."
                )
            );
        };
        // Keep the caller's file available for retry; only return buffers transfer.
        worker.postMessage(request);
    });
}
export const openPvxFile = (
    file: ToolFile,
    signal: AbortSignal,
    status: (text: string) => void
) => execute<string>({ kind: "open", file }, signal, status);
export const updatePvx = (
    edit: PvxEdit,
    signal: AbortSignal,
    status: (text: string) => void
) => execute<Converted>({ kind: "convert", edit }, signal, status);
