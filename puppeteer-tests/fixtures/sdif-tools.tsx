import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import TransformRounded from "@mui/icons-material/TransformRounded";
import SdifTool from "../../src/components/sdif-tools/sdif-tool";
import { exampleSdif } from "../../src/components/sdif-tools/format";
import type { ToolFile } from "../../src/components/audio-tools/types";
import dark from "../../src/styles/_theme-dracula";
import light from "../../src/styles/_theme-github-light";
const colors = new URLSearchParams(location.search).has("light") ? light : dark;
const theme = createTheme({
    ...colors,
    font: { regular: "sans-serif", monospace: "monospace" }
});
let saved: ToolFile | undefined;
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
                        <SdifTool
                            sources={[
                                {
                                    id: "source",
                                    name: "tracks.sdif",
                                    load: async () => exampleSdif()
                                },
                                {
                                    id: "invalid",
                                    name: "broken.sdif",
                                    load: async () => new Uint8Array([1, 2])
                                },
                                {
                                    id: "slow",
                                    name: "slow.sdif",
                                    load: (signal) =>
                                        new Promise((resolve, reject) => {
                                            const timer = setTimeout(
                                                () => resolve(exampleSdif()),
                                                10000
                                            );
                                            signal.addEventListener(
                                                "abort",
                                                () => {
                                                    clearTimeout(timer);
                                                    reject(
                                                        new DOMException(
                                                            "Cancelled",
                                                            "AbortError"
                                                        )
                                                    );
                                                },
                                                { once: true }
                                            );
                                        })
                                }
                            ]}
                            onSave={(file) => {
                                saved = { ...file, name: "example-2.het" };
                                return saved.name;
                            }}
                        />
                    ) : (
                        <p style={{ padding: 24 }}>
                            Open the SDIF converter below.
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
                        <TransformRounded fontSize="small" />
                        SDIF Converter
                    </button>
                </footer>
            </main>
        </ThemeProvider>
    );
}
createRoot(document.getElementById("root")!).render(<Fixture />);

// Verify saved output with the published Csound engine, not just our own parser.
(window as any).renderSdif = async () => {
    if (!saved) throw new Error("Save first");
    const { Csound } = await import("@csound/browser");
    const csound = await Csound({ useWorker: true, useSAB: false });
    if (!csound) throw new Error("Csound did not start");
    const messages: string[] = [];
    csound.on("message", (message: string) => messages.push(message));
    try {
        await csound.fs.writeFile("example-2.het", saved.data);
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
aSignal adsyn 0.1, 1, 1, "example-2.het"
out aSignal
endin
</CsInstruments>
<CsScore>
i1 0 1
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
