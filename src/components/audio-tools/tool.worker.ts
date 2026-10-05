import { executeTool } from "./wasi";
import type { ToolMessage, ToolName, ToolRequest } from "./types";
import scale from "@csound/wasm-bin/lib/scale.wasm?url";
import srcConv from "@csound/wasm-bin/lib/src_conv.wasm?url";
import dnoise from "@csound/wasm-bin/lib/dnoise.wasm?url";
import pvanal from "@csound/wasm-bin/lib/pvanal.wasm?url";
import pvlook from "@csound/wasm-bin/lib/pvlook.wasm?url";
import atsa from "@csound/wasm-bin/lib/atsa.wasm?url";
import hetro from "@csound/wasm-bin/lib/hetro.wasm?url";
import lpanal from "@csound/wasm-bin/lib/lpanal.wasm?url";
import envext from "@csound/wasm-bin/lib/envext.wasm?url";

// URL imports emit separate assets; they do not fetch or compile the binaries.
const urls: Record<ToolName, string> = {
    scale,
    src_conv: srcConv,
    dnoise,
    pvanal,
    pvlook,
    atsa,
    hetro,
    lpanal,
    envext
};
const send = (message: ToolMessage) => self.postMessage(message);
self.onmessage = async ({ data }: MessageEvent<ToolRequest>) => {
    try {
        send({ type: "status", text: "Loading audio tool…" });
        const response = await fetch(urls[data.tool]);
        if (!response.ok)
            throw new Error("Could not load the audio tool. Try again.");
        // arrayBuffer also works on hosts that omit the application/wasm MIME type.
        const module = await WebAssembly.compile(await response.arrayBuffer());
        send({ type: "status", text: "Processing audio…" });
        const result = await executeTool(module, data);
        send({ type: "result", result });
    } catch (error) {
        send({
            type: "error",
            message:
                error instanceof WebAssembly.CompileError
                    ? "This browser cannot run the audio tools. Try a current version of Chrome or Firefox."
                    : error instanceof Error
                      ? error.message
                      : "The audio tool failed. Try again."
        });
    }
};
