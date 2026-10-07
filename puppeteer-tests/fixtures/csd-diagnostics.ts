import { store } from "../../src/store";
import {
    runPerformance,
    stopPerformance
} from "../../src/components/csound/actions";

const source = `<CsoundSynthesizer>
<CsOptions>
-odac
</CsOptions>
<CsInstruments>
sr = 48000
ksmps = 64
nchnls = 2
0dbfs = 1
#include "bid.udo"
instr 1
a1 oscili 0.001, 220
outs a1, a1
endin
</CsInstruments>
<CsScore>
i1 0 0.01
</CsScore>
</CsoundSynthesizer>`;

(window as any).compileFixture = async ({
    mode,
    useSAB,
    error = "include"
}: {
    mode: "play" | "render";
    useSAB: boolean;
    error?: "include" | "csd" | "none";
}) => {
    const csd =
        error === "csd"
            ? source.replace("a1 oscili 0.001, 220", 'prints("bad" "syntax")')
            : source;
    store.dispatch({
        type: "PROJECTS.UNSET_PROJECT",
        projectUid: "diagnostics"
    });
    store.dispatch({
        type: "PROJECTS.STORE_PROJECT_LOCALLY",
        projects: [
            {
                projectUid: "diagnostics",
                documents: {
                    folder: {
                        documentUid: "folder",
                        filename: "scores",
                        path: [],
                        type: "folder"
                    },
                    csd: {
                        documentUid: "csd",
                        filename: "my piece.csd",
                        path: ["folder"],
                        type: "txt",
                        currentValue: csd
                    },
                    udo: {
                        documentUid: "udo",
                        filename: "bid.udo",
                        path: [],
                        type: "txt",
                        currentValue:
                            error === "include"
                                ? 'instr 2\nprints("bad" "syntax")\nendin'
                                : "; valid include\n"
                    }
                }
            }
        ]
    });
    let messages: string[] = [];
    let failure = "";
    let audioBytes = 0;
    let status = "";
    try {
        const result = await runPerformance({
            projectUid: "diagnostics",
            csdPath: "scores/my piece.csd",
            mode,
            useSAB,
            collectFiles: false,
            ...(mode === "render"
                ? {
                      renderSettings: {
                          filename: "test-export",
                          format: "wav" as const,
                          bitDepth: "16" as const,
                          quality: 0.9,
                          sampleRate: 48000
                      }
                  }
                : {}),
            setConsole: (update) => {
                messages =
                    typeof update === "function" ? update(messages) : update;
            }
        });
        status = result.status;
        audioBytes = result.audio?.length ?? 0;
    } catch (error) {
        failure = String(error);
    } finally {
        await stopPerformance();
    }
    return { messages, failure, status, audioBytes };
};
