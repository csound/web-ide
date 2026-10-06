import { durationOf, encodeAudioAsync } from "./audio";
import { applySampleEdits, type SampleEdit } from "./sample-edits";
import {
    makeRequest,
    resultFilename,
    type AnalysisOperation,
    type Settings
} from "./operations";
import { analysisPlot, binPlot, inspectFrame } from "./plots";
import { runTool } from "./runner";
import type { AudioData, Plot, ToolFile } from "./types";

export type LoadedAudio = ToolFile & { audio: AudioData };
export type PreviewRequest = {
    source: LoadedAudio;
    edits: SampleEdit[];
    analysis?: {
        operation: AnalysisOperation;
        settings: Settings;
        channel: number;
    };
};
export type Preview = ToolFile & {
    audio?: AudioData;
    plot?: Plot;
    sampleRate: number;
    spectrum: boolean;
};

/** Rebuild from the loaded file so automatic updates never compound earlier effects. */
export async function buildPreview(
    request: PreviewRequest,
    signal: AbortSignal,
    status: (text: string) => void
): Promise<Preview> {
    const { source, edits, analysis } = request;
    if (!analysis) {
        const output = await applySampleEdits(source, edits, signal, status);
        return {
            ...output,
            name:
                edits.length === 1
                    ? resultFilename(source.name, edits[0].operation)
                    : `${source.name.replace(/\.[^.]+$/, "")}-edited.wav`,
            sampleRate: output.audio.sampleRate,
            spectrum: false
        };
    }
    const duration = durationOf(source.audio);
    const data =
        source.audio.channels.length > 1
            ? await encodeAudioAsync(
                  source.audio,
                  signal,
                  [0, duration],
                  analysis.channel
              )
            : source.data;
    const output = await runTool(
        makeRequest(
            analysis.operation,
            analysis.settings,
            data,
            [0, duration],
            duration
        ),
        signal,
        status
    );
    signal.throwIfAborted();
    return {
        name: resultFilename(source.name, analysis.operation),
        data: output.data,
        sampleRate: source.audio.sampleRate,
        spectrum: analysis.operation === "spectrum",
        plot: analysisPlot(analysis.operation, output.data, duration)
    };
}

/** Load the optional bin inspector only while its details are open. */
export async function buildBins(
    request: { preview: Preview; time: number },
    signal: AbortSignal,
    status: (text: string) => void
) {
    const output = await runTool(
        inspectFrame(request.preview.data, request.time),
        signal,
        status
    );
    signal.throwIfAborted();
    return binPlot(output.data, request.preview.sampleRate);
}
