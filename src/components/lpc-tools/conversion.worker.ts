import { convertLpc, openLpc } from "./convert";
import type { ConversionRequest } from "./client";
// Parsing, float formatting, and binary conversion stay off the UI thread.
self.onmessage = async ({ data }: MessageEvent<ConversionRequest>) => {
    const signal = new AbortController().signal;
    const status = (text: string) => self.postMessage({ type: "status", text });
    try {
        const value =
            data.kind === "open"
                ? await openLpc(data.file, signal, status)
                : await convertLpc(data.edit, signal, status);
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
