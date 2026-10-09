// Local project only: no cloud reads or writes.
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { diagnosticCount } from "@codemirror/lint";
import { store } from "../../src/store";
import CodeEditor, { openEditors } from "../../src/components/editor/editor";
import { checkerAvailable } from "../../src/components/editor/validation/client";
import { compilerDiagnostics } from "../../src/components/editor/validation/messages";
import { udoCatalog } from "../../src/components/editor/validation/udos";
import { startCompletion } from "@codemirror/autocomplete";
import colors from "../../src/styles/_theme-dracula";
const projectUid = "checker-fixture";
const source = `<CsoundSynthesizer>
<CsOptions>-odac</CsOptions>
<CsInstruments>
sr = 48000
ksmps = 32
nchnls = 2
0dbfs = 1

instr Lead
  frequency:i = 440
  aSignal = oscili(0.1, )
  outs aSignal, aSignal
endin
</CsInstruments>
<CsScore>i "Lead" 0 1</CsScore>
</CsoundSynthesizer>`;
const includeMode = new URLSearchParams(location.search).has("udos");
const initialSource = includeMode
    ? source
          .replace("instr Lead", '#include "voice.udo"\n\ninstr Lead')
          .replace("oscili(0.1, )", "IncludedVoice(440)")
    : source;
const includedSource =
    "opcode IncludedVoice(frequency:i):a\n  xout oscili(0.1, frequency)\nendop\n";
store.dispatch({
    type: "PROJECTS.STORE_PROJECT_LOCALLY",
    projects: [
        {
            projectUid,
            documents: {
                "checker-csd": {
                    documentUid: "checker-csd",
                    filename: "piece.csd",
                    path: [],
                    type: "txt",
                    currentValue: initialSource
                },
                "checker-udo": {
                    documentUid: "checker-udo",
                    filename: "voice.udo",
                    path: [],
                    type: "txt",
                    currentValue: includedSource
                }
            }
        }
    ]
});
store.dispatch({ type: "PROJECTS.ACTIVATE_PROJECT", projectUid });
(window as any).checkerFixture = {
    available: checkerAvailable,
    count: () => diagnosticCount(openEditors.get("checker-csd")!.state),
    text: () => openEditors.get("checker-csd")!.state.doc.toString(),
    udos: () => [
        ...(openEditors
            .get("checker-csd")!
            .state.field(udoCatalog)
            ?.entries.keys() ?? [])
    ],
    include: (text: string) =>
        store.dispatch({
            type: "PROJECTS.DOCUMENT_UPDATE_VALUE",
            projectUid,
            documentUid: "checker-udo",
            val: text
        }),
    complete: () => {
        const view = openEditors.get("checker-csd")!;
        const position =
            view.state.doc.toString().indexOf("IncludedVoice(") +
            "IncludedVoice".length;
        view.dispatch({ selection: { anchor: position } });
        view.focus();
        startCompletion(view);
    },
    edit: (text: string) => {
        const view = openEditors.get("checker-csd")!;
        view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: text }
        });
    },
    compileError: () =>
        compilerDiagnostics(
            projectUid,
            "checker-csd",
            openEditors.get("checker-csd")!.state.doc.toString(),
            [{ filename: "piece.csd", line: 11, message: "Compiler error" }]
        )
};
createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
        <ThemeProvider
            theme={createTheme({
                ...colors,
                font: { regular: "sans-serif", monospace: "monospace" }
            })}
        >
            <div style={{ maxWidth: 960, height: "100vh", margin: "auto" }}>
                <CodeEditor documentUid="checker-csd" projectUid={projectUid} />
            </div>
        </ThemeProvider>
    </Provider>
);
