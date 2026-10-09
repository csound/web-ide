import { readAudioInfo } from "./metadata";

self.onmessage = async ({ data }: MessageEvent<Uint8Array>) => {
    try {
        self.postMessage({ info: await readAudioInfo(data) });
    } catch {
        self.postMessage({
            error: "File metadata is unavailable for this format."
        });
    }
};
