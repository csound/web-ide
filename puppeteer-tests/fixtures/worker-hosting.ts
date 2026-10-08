import { openLpcFile, updateLpc } from "../../src/components/lpc-tools/client";
import { exampleText } from "../../src/components/lpc-tools/format";
import { runTool } from "../../src/components/audio-tools/runner";
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

(window as any).roundTripLpc = async () => {
    const signal = new AbortController().signal;
    const binary = await updateLpc(
        { text: exampleText, name: "test" },
        signal,
        () => {}
    );
    return (await openLpcFile(binary, signal, () => {})) === exampleText;
};
