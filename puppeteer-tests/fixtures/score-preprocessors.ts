import { store } from "../../src/store";
import {
    runPerformance,
    stopPerformance
} from "../../src/components/csound/actions";
import csbeatsUrl from "@csound/wasm-bin/lib/csbeats.wasm?url";

const source = (command?: string) => `<CsoundSynthesizer>
<CsOptions>
-odac
</CsOptions>
<CsInstruments>
sr = 48000
ksmps = 32
nchnls = 1
0dbfs = 1
instr 1
prints "generated frequency %.4f\\n", p4
prints "generated pitch %.2f\\n", p5
out poscil(0.01, p4)
endin
</CsInstruments>
<CsScore${command ? ` bin="${command}"` : ""}>
${command?.includes("scot") ? "orchestra { voice=1 }\nscore { $voice 64c }" : command ? "i1 m1 b1 C4 q mf" : "i1 0 .01 440"}
</CsScore>
</CsoundSynthesizer>`;

(window as any).scoreFixture = async ({
    mode,
    useSAB,
    command,
    uploaded = false
}: {
    mode: "play" | "render";
    useSAB: boolean;
    command?: string;
    uploaded?: boolean | "failure";
}) => {
    store.dispatch({
        type: "PROJECTS.UNSET_PROJECT",
        projectUid: "score-test"
    });
    store.dispatch({
        type: "PROJECTS.STORE_PROJECT_LOCALLY",
        projects: [
            {
                projectUid: "score-test",
                documents: {
                    csd: {
                        documentUid: "csd",
                        filename: "beats.csd",
                        type: "txt",
                        path: [],
                        currentValue: source(command)
                    },
                    folder: {
                        documentUid: "folder",
                        filename: "tools",
                        type: "folder",
                        path: []
                    }
                }
            }
        ]
    });
    let messages: string[] = [];
    let finish!: () => void;
    const ended = new Promise<void>((resolve) => {
        finish = resolve;
    });
    try {
        const inputFiles = uploaded
            ? [
                  {
                      name: `${command}.wasm`,
                      // A standalone WASI program that calls proc_exit(7) proves
                      // an uploaded csbeats.wasm wins over the bundled command.
                      data:
                          uploaded === "failure"
                              ? Uint8Array.from(
                                    atob(
                                        "AGFzbQEAAAABCAJgAX8AYAAAAiQBFndhc2lfc25hcHNob3RfcHJldmlldzEJcHJvY19leGl0AAADAgEBBQMBAAEHEwIGbWVtb3J5AgAGX3N0YXJ0AAEKCAEGAEEHEAAL"
                                    ),
                                    (character) => character.charCodeAt(0)
                                )
                              : new Uint8Array(
                                    await (
                                        await fetch(csbeatsUrl)
                                    ).arrayBuffer()
                                )
                  }
              ]
            : [];
        const result = await runPerformance({
            projectUid: "score-test",
            csdPath: "beats.csd",
            inputFiles,
            collectFiles: false,
            mode,
            useSAB,
            onEnded: finish,
            setConsole: (update) => {
                messages =
                    typeof update === "function" ? update(messages) : update;
            }
        });
        if (result.status === "playing") await ended;
        return {
            messages,
            status: result.status,
            audioBytes: result.audio?.length ?? 0
        };
    } catch (error) {
        return { messages, failure: String(error) };
    } finally {
        await stopPerformance();
    }
};
