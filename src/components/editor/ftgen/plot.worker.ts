import { generateTable } from "./run";
import type { TableRequest } from "./source";
let compiled: Promise<WebAssembly.Module> | undefined;
self.onmessage = async ({
    data
}: MessageEvent<{ request: TableRequest; url: string }>) => {
    try {
        compiled ??= fetch(data.url).then(async (response) => {
            if (!response.ok)
                throw new Error(
                    "Table preview is unavailable. Reload after the next deployment."
                );
            return WebAssembly.compile(await response.arrayBuffer());
        });
        const samples = await generateTable(await compiled, data.request);
        self.postMessage({ samples }, { transfer: [samples.buffer] });
    } catch (error) {
        self.postMessage({
            error:
                error instanceof Error ? error.message : "Table preview failed."
        });
    }
};
