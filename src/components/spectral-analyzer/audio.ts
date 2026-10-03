import type { CsoundObj } from "@comp/csound/types";
import { FFT_SIZE, MIN_DB, MAX_DB } from "./analysis";

export function observeAudio(
    csound: Pick<CsoundObj, "getNode" | "on" | "off">,
    ready: (analyser: AnalyserNode) => void,
    failed: () => void
) {
    let disposed = false;
    let source: AudioNode | undefined;
    let analyser: AnalyserNode | undefined;
    const connect = async () => {
        try {
            const node = await csound.getNode();
            if (disposed || source || !node) return;
            source = node;
            analyser = node.context.createAnalyser();
            analyser.fftSize = FFT_SIZE;
            analyser.minDecibels = MIN_DB;
            analyser.maxDecibels = MAX_DB;
            analyser.smoothingTimeConstant = 0;
            node.connect(analyser);
            ready(analyser);
        } catch {
            if (!disposed) failed();
        }
    };
    // The IDE enters "playing" just before start() creates the audio node.
    csound.on("realtimePerformanceStarted", connect);
    void connect();
    return () => {
        disposed = true;
        csound.off("realtimePerformanceStarted", connect);
        if (source && analyser) {
            try {
                source.disconnect(analyser);
            } catch {
                // Csound may have already disposed the node after stopping.
            }
            analyser.disconnect();
        }
    };
}
