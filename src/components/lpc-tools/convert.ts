import type { ToolFile } from "../audio-tools/types";
import {
    checkLpcSize,
    formatLpc,
    parseLpcText,
    readLpc,
    writeLpc
} from "./format";
export type LpcEdit = { text: string; name: string };
// @csound/wasm-bin beta28's lpc_import reads binary and writes partial text;
// lpc_export also uses the wrong frame width. Neither can round-trip lpanal
// output. Use the documented LPC layout in this lazy worker until they are fixed.
export async function openLpc(
    file: ToolFile,
    signal: AbortSignal,
    status: (text: string) => void
) {
    signal.throwIfAborted();
    checkLpcSize(file.data.length);
    status("Reading LPC frames…");
    const text = new TextDecoder()
        .decode(file.data.subarray(0, 32))
        .trimStart();
    return formatLpc(
        text.startsWith("LPC\n") || text.startsWith("LPC\r\n")
            ? parseLpcText(
                  new TextDecoder("utf-8", { fatal: true }).decode(file.data)
              )
            : readLpc(file.data)
    );
}
export async function convertLpc(
    request: LpcEdit,
    signal: AbortSignal,
    status: (text: string) => void
) {
    signal.throwIfAborted();
    status("Updating LPC frames…");
    const analysis = parseLpcText(request.text),
        text = formatLpc(analysis),
        data = writeLpc(analysis);
    const stem =
        request.name.replace(/^.*[/\\]/, "").replace(/\.[^.]+$/, "") ||
        "analysis";
    return { name: `${stem}.lpc`, data, text, analysis };
}
