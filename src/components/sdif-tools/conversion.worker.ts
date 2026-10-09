import { inspectSdif, convertSdif } from "./convert";
import type { Request } from "./client";
// Parsing and normalization stay off the UI thread. Termination also stops the native child worker.
self.onmessage = async ({ data }: MessageEvent<Request>) => {
    try {
        const value =
            data.kind === "inspect"
                ? await inspectSdif(data.file)
                : await convertSdif(
                      data.request,
                      new AbortController().signal,
                      (text) => self.postMessage({ type: "status", text })
                  );
        const transfer = Array.isArray(value)
            ? []
            : [
                  value.data.buffer,
                  ...value.tracks.map((track) => track.points.buffer)
              ];
        self.postMessage({ type: "result", value }, { transfer });
    } catch (error) {
        self.postMessage({
            type: "error",
            message:
                error instanceof Error
                    ? error.message
                    : "Could not convert this SDIF file."
        });
    }
};
