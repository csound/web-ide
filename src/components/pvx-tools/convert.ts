import { runTool } from "../audio-tools/runner";
import type { ToolFile } from "../audio-tools/types";
import {
    checkPvxSize,
    formatPvx,
    parsePvxText,
    readPvx,
    WAVE_HEADER
} from "./format";

export type PvxEdit = { text: string; name: string };
export async function openPvx(
    file: ToolFile,
    signal: AbortSignal,
    status: (text: string) => void
) {
    checkPvxSize(file.data.length);
    if (
        new TextDecoder()
            .decode(file.data.subarray(0, 128))
            .trimStart()
            .startsWith(WAVE_HEADER)
    )
        return formatPvx(
            parsePvxText(
                new TextDecoder("utf-8", { fatal: true }).decode(file.data)
            )
        );
    const original = readPvx(file.data).analysis;
    const exported = await runTool(
        {
            tool: "pv_export",
            args: ["input.pvx", "output.txt"],
            files: [{ name: "input.pvx", data: file.data }],
            output: "output.txt"
        },
        signal,
        status
    );
    signal.throwIfAborted();
    const csv = parsePvxText(new TextDecoder().decode(exported.data));
    if (
        csv.values.length !== original.values.length ||
        csv.wave.some((value, index) => value !== original.wave[index]) ||
        csv.pv.slice(0, 8).some((value, index) => value !== original.pv[index])
    )
        throw new Error(
            "The converter could not read this PVX analysis without changing its layout."
        );
    // pv_export uses %g (six significant digits). Use the validated original
    // float32 values for editable text, so unedited data retains full precision.
    return formatPvx(original);
}
export async function convertPvx(
    request: PvxEdit,
    signal: AbortSignal,
    status: (text: string) => void
) {
    const analysis = parsePvxText(request.text);
    const text = formatPvx(analysis);
    const result = await runTool(
        {
            tool: "pv_import",
            args: ["input.txt", "output.pvx"],
            files: [
                { name: "input.txt", data: new TextEncoder().encode(text) }
            ],
            output: "output.pvx"
        },
        signal,
        status
    );
    signal.throwIfAborted();
    const output = readPvx(result.data);
    // pv_import selects the source type from BitsPerSample and always turns
    // a float source into PCM32. Both share the same byte layout; retain the
    // explicit SourceFormat that was validated from the user's text.
    new DataView(
        result.data.buffer,
        result.data.byteOffset,
        result.data.byteLength
    ).setUint16(output.fmtOffset + 52, analysis.pv[2], true);
    const verified = readPvx(result.data).analysis;
    if (formatPvx(verified) !== text)
        throw new Error(
            "The converter could not preserve this analysis. No result was saved."
        );
    const stem =
        request.name.replace(/^.*[/\\]/, "").replace(/\.[^.]+$/, "") ||
        "analysis";
    return { name: `${stem}.pvx`, data: result.data, text, analysis: verified };
}
