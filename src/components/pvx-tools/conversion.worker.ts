import { convertPvx, openPvx } from "./convert";
import type { ConversionRequest } from "./client";
// Parsing, float formatting, and native conversion stay off the UI thread.
// Terminating this worker also terminates its native command worker.
self.onmessage = async ({ data }: MessageEvent<ConversionRequest>) => {
    const signal = new AbortController().signal;
    const status = (text: string) => self.postMessage({ type: "status", text });
    try {
        const value =
            data.kind === "open"
                ? await openPvx(data.file, signal, status)
                : await convertPvx(data.edit, signal, status);
        const transfer =
            typeof value === "string"
                ? []
                : [value.data.buffer, value.analysis.values.buffer];
        self.postMessage({ type: "result", value }, { transfer });
    } catch (error) {
        self.postMessage({
            type: "error",
            message:
                error instanceof Error
                    ? error.message
                    : "Could not convert this analysis."
        });
    }
};
