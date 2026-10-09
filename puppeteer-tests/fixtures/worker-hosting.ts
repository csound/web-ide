import { runTool } from "../../src/components/audio-tools/runner";
import {
    buildMix,
    trackDefaults
} from "../../src/components/audio-tools/mixer";
import {
    durationOf,
    encodeAudio
} from "../../src/components/audio-tools/audio";
import {
    convertScore,
    scoreExamples
} from "../../src/components/score-tools/convert";
import type { ScoreProgram } from "../../src/components/score-tools/programs";
import {
    sweepDefaults,
    sweepRequest
} from "../../src/components/audio-tools/impulse";

const result = document.querySelector<HTMLOutputElement>("#result")!;
(window as any).mixAudio = async () => {
    const audio = {
        sampleRate: 8000,
        channels: [
            new Float32Array(8000).fill(0.25),
            new Float32Array(8000).fill(0.1)
        ]
    };
    const mixed = await buildMix(
        {
            tracks: [
                {
                    ...trackDefaults,
                    id: "tone",
                    name: "tone.wav",
                    audio,
                    data: encodeAudio(audio),
                    start: 2
                }
            ],
            gain: 0
        },
        new AbortController().signal,
        () => {}
    );
    return {
        duration: durationOf(mixed.audio),
        peak: mixed.peak,
        channels: mixed.audio.channels.length
    };
};
(window as any).convertScore = async (program: ScoreProgram) =>
    (
        await convertScore(
            { program, source: scoreExamples[program], selection: "i 1" },
            new AbortController().signal,
            () => {}
        )
    ).text;
document.querySelector("#generate")!.addEventListener("click", async () => {
    try {
        const { data } = await runTool(
            sweepRequest(sweepDefaults),
            new AbortController().signal,
            () => {}
        );
        result.textContent = `${new TextDecoder().decode(data.slice(0, 4))}:${data.length}`;
    } catch (error) {
        result.textContent =
            error instanceof Error ? error.message : String(error);
    }
});

(window as any).convertSdifFixture = async () => {
    const { inspectFile, updateSdif } =
        await import("../../src/components/sdif-tools/client");
    const { exampleSdif, defaults } =
        await import("../../src/components/sdif-tools/format");
    const file = { name: "example.sdif", data: exampleSdif() };
    const signal = new AbortController().signal;
    const streams = await inspectFile(file, signal, () => {});
    const converted = await updateSdif(
        { file, settings: defaults(streams[0]) },
        signal,
        () => {}
    );
    return {
        name: converted.name,
        size: converted.data.length,
        partials: new DataView(converted.data.buffer).getInt16(0, true),
        duration: converted.duration
    };
};
