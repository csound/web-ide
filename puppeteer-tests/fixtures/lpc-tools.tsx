import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { EditorView } from "@codemirror/view";
import GraphicEqRounded from "@mui/icons-material/GraphicEqRounded";
import LpcTool from "../../src/components/lpc-tools/lpc-tool";
import { exampleText } from "../../src/components/lpc-tools/format";
import type { ToolFile } from "../../src/components/audio-tools/types";
import dark from "../../src/styles/_theme-dracula";
import light from "../../src/styles/_theme-github-light";
const colors = new URLSearchParams(location.search).has("light") ? light : dark;
const theme = createTheme({
    ...colors,
    font: { regular: "sans-serif", monospace: "monospace" }
});
let saved: ToolFile | undefined;
(window as any).selectedLpcRow = () => {
    const view = EditorView.findFromDOM(
        document.querySelector('[aria-label="LPC text"]')!
    )!;
    return view.state.doc.lineAt(view.state.selection.main.from).number;
};
(window as any).editLpc = (text: string) => {
    const view = EditorView.findFromDOM(
        document.querySelector('[aria-label="LPC text"]')!
    )!;
    view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text }
    });
};
(window as any).readLpc = () =>
    EditorView.findFromDOM(
        document.querySelector('[aria-label="LPC text"]')!
    )!.state.doc.toString();
function Fixture() {
    const [open, setOpen] = useState(false);
    return (
        <ThemeProvider theme={theme}>
            <main
                style={{
                    height: "100dvh",
                    display: "flex",
                    flexDirection: "column",
                    background: colors.background,
                    color: colors.textColor,
                    fontFamily: "sans-serif"
                }}
            >
                <div style={{ flex: 1, minHeight: 0 }}>
                    {open ? (
                        <LpcTool
                            sources={[
                                {
                                    id: "text",
                                    name: "frames.txt",
                                    load: async () =>
                                        new TextEncoder().encode(exampleText)
                                },
                                {
                                    id: "saved",
                                    name: "Saved analysis.lpc",
                                    load: async () => {
                                        if (!saved)
                                            throw new Error(
                                                "Save an analysis first."
                                            );
                                        return saved.data.slice();
                                    }
                                }
                            ]}
                            onSave={(file) => {
                                saved = file;
                                return file.name;
                            }}
                        />
                    ) : (
                        <p style={{ padding: 24 }}>
                            Open the LPC editor below.
                        </p>
                    )}
                </div>
                <footer
                    style={{
                        padding: 4,
                        borderTop: `1px solid ${colors.line}`,
                        background: colors.headerBackground
                    }}
                >
                    <button
                        onClick={() => setOpen(!open)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            border: 0,
                            background: "transparent",
                            color: "inherit",
                            padding: "6px 10px"
                        }}
                    >
                        <GraphicEqRounded fontSize="small" />
                        LPC Editor
                    </button>
                </footer>
            </main>
        </ThemeProvider>
    );
}
createRoot(document.getElementById("root")!).render(<Fixture />);

// Verify saved output with the published Csound engine, not just our own parser.
(window as any).renderLpc = async (poles: boolean) => {
    if (!saved) throw new Error("Save first");
    const { Csound } = await import("@csound/browser");
    const { readLpc, formatLpc } =
        await import("../../src/components/lpc-tools/format");
    const { updateLpc } = await import("../../src/components/lpc-tools/client");
    let input = saved;
    if (poles) {
        const analysis = readLpc(saved.data);
        analysis.magic = 2399;
        const frames = analysis.values.length / analysis.width;
        analysis.width = 8;
        analysis.values = Float64Array.from(
            { length: frames * 8 },
            (_, i) => [0.01, 0.1, 0.01, 220, 0.95, 0.5, 0.95, -0.5][i % 8]
        );
        input = await updateLpc(
            { text: formatLpc(analysis), name: "poles.lpc" },
            new AbortController().signal,
            () => {}
        );
    }
    const csound = await Csound({ useWorker: true, useSAB: false });
    if (!csound) throw new Error("Csound did not start");
    const messages: string[] = [];
    csound.on("message", (message: string) => messages.push(message));
    try {
        await csound.fs.writeFile("analysis.lpc", input.data);
        await csound.fs.writeFile(
            "test.csd",
            new TextEncoder().encode(`<CsoundSynthesizer>
<CsOptions>
-ooutput.raw -h -f -m0
</CsOptions>
<CsInstruments>
sr=8000
ksmps=32
nchnls=1
0dbfs=1
instr 1
kTime line 0, p3, 0.04
kResidual, kSource, kError, kPitch lpread kTime, "analysis.lpc"
printks "LPC pitch %.4f\\n", 0.01, kPitch
aExc poscil 0.01, 220
aOut lpreson aExc
out aOut * 0.05
endin
</CsInstruments>
<CsScore>
i1 0 0.05
</CsScore>
</CsoundSynthesizer>`)
        );
        const compiled = await csound.compileCSD("test.csd", 0);
        if (compiled) throw new Error(messages.join("\n"));
        const ended = new Promise<void>((resolve) =>
            csound.once("renderEnded", resolve)
        );
        const started = await csound.start();
        if (started) throw new Error(messages.join("\n"));
        await ended;
        await csound.reset();
        const bytes = await csound.fs.readFile("output.raw");
        if (bytes.length % 4) throw new Error("Incomplete PCM render");
        const view = new DataView(
            bytes.buffer,
            bytes.byteOffset,
            bytes.byteLength
        );
        const samples = Float32Array.from(
            { length: bytes.length / 4 },
            (_, i) => view.getFloat32(i * 4, true)
        );
        return {
            messages,
            samples: samples.length,
            finite: samples.every(Number.isFinite),
            peak: Math.max(...samples.map(Math.abs))
        };
    } finally {
        await csound.terminateInstance();
    }
};
