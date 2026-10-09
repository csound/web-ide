import { executeTool } from "./wasi";
import type { ToolMessage, ToolName, ToolRequest } from "./types";
import {
    isScoreProgram,
    loadScoreProgram,
    type ScoreProgram
} from "../score-tools/programs";
import scale from "@csound/wasm-bin/lib/scale.wasm?url";
import srcConv from "@csound/wasm-bin/lib/src_conv.wasm?url";
import dnoise from "@csound/wasm-bin/lib/dnoise.wasm?url";
import pvanal from "@csound/wasm-bin/lib/pvanal.wasm?url";
import pvlook from "@csound/wasm-bin/lib/pvlook.wasm?url";
import atsa from "@csound/wasm-bin/lib/atsa.wasm?url";
import hetro from "@csound/wasm-bin/lib/hetro.wasm?url";
import lpanal from "@csound/wasm-bin/lib/lpanal.wasm?url";
import envext from "@csound/wasm-bin/lib/envext.wasm?url";

import pvExport from "@csound/wasm-bin/lib/pv_export.wasm?url";
import pvImport from "@csound/wasm-bin/lib/pv_import.wasm?url";
import mkir from "@csound/wasm-bin/lib/mkir.wasm?url";
import cvanal from "@csound/wasm-bin/lib/cvanal.wasm?url";
import mixer from "@csound/wasm-bin/lib/mixer.wasm?url";

// URL imports emit separate assets; they do not fetch or compile the binaries.
const urls: Record<Exclude<ToolName, ScoreProgram>, string> = {
    pv_export: pvExport,
    pv_import: pvImport,
    mixer,
    mkir,
    cvanal,
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
/** Send progress or a final result to the caller without exposing worker state. */
const send = (message: ToolMessage) => {
    const transfer =
        message.type === "result" &&
        message.result.data.buffer instanceof ArrayBuffer
            ? [message.result.data.buffer]
            : [];
    self.postMessage(message, { transfer });
};
self.onmessage = async ({ data }: MessageEvent<ToolRequest>) => {
    const kind = isScoreProgram(data.tool) ? "score" : "audio";
    try {
        send({ type: "status", text: `Loading ${kind} tool…` });
        let bytes: Uint8Array;
        if (isScoreProgram(data.tool))
            bytes = await loadScoreProgram(data.tool);
        else {
            const response = await fetch(urls[data.tool]);
            if (!response.ok)
                throw new Error(`Could not load the ${kind} tool. Try again.`);
            bytes = new Uint8Array(await response.arrayBuffer());
        }
        // arrayBuffer also works on hosts that omit the application/wasm MIME type.
        const module = await WebAssembly.compile(bytes);
        send({
            type: "status",
            text: kind === "score" ? "Converting score…" : "Processing audio…"
        });
        const result = await executeTool(module, data);
        send({ type: "result", result });
    } catch (error) {
        send({
            type: "error",
            message:
                error instanceof WebAssembly.CompileError
                    ? "This browser cannot run the tools. Try a current version of Chrome or Firefox."
                    : error instanceof Error
                      ? error.message
                      : `The ${kind} tool failed. Try again.`
        });
    }
};
