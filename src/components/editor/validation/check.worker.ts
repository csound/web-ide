import { runCheck } from "./run";
import type { CheckRequest } from "./types";
let compiled: Promise<WebAssembly.Module> | undefined;
self.onmessage = async ({
    data
}: MessageEvent<CheckRequest & { url: string }>) => {
    try {
        compiled ??= fetch(data.url).then(async (response) => {
            if (!response.ok) throw new Error("Checker unavailable");
            return WebAssembly.compile(await response.arrayBuffer());
        });
        const { available, diagnostics, udos, valid, udosComplete } =
            await runCheck(await compiled, data);
        self.postMessage({ available, diagnostics, udos, valid, udosComplete });
    } catch {
        self.postMessage({ available: false, diagnostics: [] });
    }
};
