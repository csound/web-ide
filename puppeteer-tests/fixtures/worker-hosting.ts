import { runTool } from "../../src/components/audio-tools/runner";
import {
    sweepDefaults,
    sweepRequest
} from "../../src/components/audio-tools/impulse";

const result = document.querySelector<HTMLOutputElement>("#result")!;
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
