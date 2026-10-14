import { store } from "../../src/store";
import {
    runPerformance,
    stopPerformance
} from "../../src/components/csound/actions";
import { readWave } from "../../src/components/csound/wave-files";
import { convertScore } from "../../src/components/score-tools/convert";

const source = `<CsoundSynthesizer>
<CsOptions>
-odac --format=wav:float
</CsOptions>
<CsInstruments>
sr = 48000
ksmps = 32
nchnls = 1
0dbfs = 1
instr 1
iv la_i_vr_create 2
iv la_i_vr_set 0, 3
iv la_i_vr_set 1, 4
inorm la_i_norm_euclid_vr iv
prints "plugin norm %.0f\\n", inorm
ih imagecreate 2, 3
iwidth, iheight imagesize ih
prints "plugin image %.0fx%.0f\\n", iwidth, iheight
a1, a2, a3 chuap 0.018, 0, 1e-7, 1/1500, -0.0008, -0.0005, 1, 1e-8, 0, 0, 0.1, 1e-5
amandolin STKMandolin 220, 0.5
out amandolin + tanh(a3) * 0.01
endin
</CsInstruments>
<CsScore>
i1 0 .1
e
</CsScore>
</CsoundSynthesizer>`;

(window as any).pluginTool = () =>
    convertScore(
        { program: "csbeats", source: "i1 m1 b1 C4 q mf", selection: "" },
        new AbortController().signal,
        () => {}
    );

(window as any).pluginPerformance = async ({
    mode,
    useSAB
}: {
    mode: "play" | "render";
    useSAB: boolean;
}) => {
    store.dispatch({
        type: "PROJECTS.STORE_PROJECT_LOCALLY",
        projects: [{ projectUid: "plugin-test", documents: {} }]
    });
    let messages: string[] = [];
    let finish!: (reason: string) => void;
    const ended = new Promise<string>((resolve) => {
        finish = resolve;
    });
    try {
        const result = await runPerformance({
            projectUid: "plugin-test",
            csdText: source,
            collectFiles: false,
            mode,
            useSAB,
            onEnded: finish,
            setConsole: (update) => {
                messages =
                    typeof update === "function" ? update(messages) : update;
            }
        });
        const reason = await ended;
        let peak = 0;
        if (result.audio) {
            const wave = readWave(result.audio);
            if (wave.format !== 3 || wave.bits !== 32)
                throw new Error("Expected float32 audio");
            const view = new DataView(
                wave.data.buffer,
                wave.data.byteOffset,
                wave.data.byteLength
            );
            for (let offset = 0; offset < view.byteLength; offset += 4) {
                const sample = view.getFloat32(offset, true);
                if (!Number.isFinite(sample))
                    throw new Error("Non-finite audio sample");
                peak = Math.max(peak, Math.abs(sample));
            }
        }
        return {
            messages,
            reason,
            peak,
            audioBytes: result.audio?.length ?? 0
        };
    } catch (error) {
        return { messages, failure: String(error) };
    } finally {
        await stopPerformance();
    }
};
