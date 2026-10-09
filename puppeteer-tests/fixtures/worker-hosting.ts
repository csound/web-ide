import { runTool } from "../../src/components/audio-tools/runner";
import {
    convertHetro,
    openHetro,
    exampleText
} from "../../src/components/hetro-tools/convert";
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
(window as any).roundTripHetro = async () => {
    const signal = new AbortController().signal;
    const binary = await convertHetro(
        { text: exampleText, name: "test" },
        signal,
        () => {}
    );
    return (await openHetro(binary, signal, () => {})) === exampleText;
};
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
