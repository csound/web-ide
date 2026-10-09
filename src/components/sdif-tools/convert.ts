import type { ToolFile } from "../audio-tools/types";
import { runTool } from "../audio-tools/runner";
import {
    prepare,
    readSdif,
    streamInfo,
    verifyAds,
    type Settings
} from "./format";
export type SdifRequest = { file: ToolFile; settings: Settings };
export async function inspectSdif(file: ToolFile) {
    return streamInfo(readSdif(file.data));
}
export async function convertSdif(
    { file, settings }: SdifRequest,
    signal: AbortSignal,
    status: (text: string) => void
) {
    signal.throwIfAborted();
    status("Reading partial tracks…");
    const stream = readSdif(file.data).find((s) => s.id === settings.stream);
    if (!stream) throw new Error("Choose a stream from this file.");
    const prepared = prepare(stream, settings);
    const result = await runTool(
        {
            tool: "sdif2ad",
            args: ["input.sdif", "output.het"],
            files: [{ name: "input.sdif", data: prepared.bytes }],
            output: "output.het"
        },
        signal,
        status
    );
    signal.throwIfAborted();
    verifyAds(result.data, prepared.tracks);
    const stem =
        file.name.replace(/^.*[/\\]/, "").replace(/\.[^.]+$/, "") || "partials";
    return {
        name: `${stem}.het`,
        data: result.data,
        tracks: prepared.tracks,
        duration: prepared.duration,
        omitted: prepared.omitted
    };
}
