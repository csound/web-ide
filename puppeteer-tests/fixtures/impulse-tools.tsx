import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import GraphicEq from "@mui/icons-material/GraphicEq";
import ListAltRounded from "@mui/icons-material/ListAltRounded";
import AutoStoriesRounded from "@mui/icons-material/AutoStoriesRounded";
import MusicNote from "@mui/icons-material/MusicNote";
import ContentCut from "@mui/icons-material/ContentCut";
import StackedLineChart from "@mui/icons-material/StackedLineChart";
import WavesRounded from "@mui/icons-material/WavesRounded";
import FilterAltRounded from "@mui/icons-material/FilterAltRounded";
import ImpulseTool from "../../src/components/audio-tools/impulse-tool";
import { ToolOverflow } from "../../src/components/project-editor/tool-overflow";
import { WebMcpLink } from "../../src/webmcp/provider";
import { encodeAudio } from "../../src/components/audio-tools/audio";
import type { ToolFile } from "../../src/components/audio-tools/types";
import dark from "../../src/styles/_theme-dracula";
import light from "../../src/styles/_theme-github-light";

const colors = new URLSearchParams(location.search).has("light") ? light : dark;
const theme = createTheme({
    ...colors,
    font: { regular: "sans-serif", monospace: "monospace" }
});
const items = [
    { type: "console", label: "Console", Icon: ListAltRounded },
    { type: "manual", label: "Csound Manual", Icon: AutoStoriesRounded },
    { type: "piano", label: "Virtual Midi Keyboard", Icon: MusicNote },
    { type: "spectrum", label: "Spectral Analyzer", Icon: GraphicEq },
    { type: "sample", label: "Sample Editor", Icon: ContentCut },
    { type: "analysis", label: "Audio Analysis", Icon: StackedLineChart },
    { type: "impulse", label: "Impulse Response", Icon: WavesRounded },
    { type: "convolution", label: "Convolution Prep", Icon: FilterAltRounded }
];
const samples = new Float32Array(4800);
samples[100] = 0.8;
samples[800] = 0.4;
samples[1600] = 0.2;
const ir = encodeAudio({ sampleRate: 48000, channels: [samples] });
function Fixture() {
    const [selected, setSelected] = useState("console");
    const [files, setFiles] = useState<ToolFile[]>([
        { name: "room.wav", data: ir }
    ]);
    return (
        <ThemeProvider theme={theme}>
            <main
                style={{
                    height: "100dvh",
                    display: "flex",
                    flexDirection: "column",
                    fontFamily: "sans-serif",
                    background: colors.background,
                    color: colors.textColor
                }}
            >
                <div style={{ flex: 1, minHeight: 0 }}>
                    {selected === "impulse" || selected === "convolution" ? (
                        <ImpulseTool
                            key={selected}
                            mode={selected}
                            sources={files
                                .filter((file) => file.name.endsWith(".wav"))
                                .map((file) => ({
                                    id: file.name,
                                    name: file.name,
                                    load: async () => file.data
                                }))}
                            onSave={(file) => {
                                setFiles((current) => [
                                    ...current.filter(
                                        (old) => old.name !== file.name
                                    ),
                                    file
                                ]);
                                return file.name;
                            }}
                        />
                    ) : (
                        <p style={{ padding: 24 }}>
                            Choose Impulse Response or Convolution Prep in the
                            footer.
                        </p>
                    )}
                </div>
                <footer
                    aria-label="Editor footer"
                    style={{
                        display: "flex",
                        minWidth: 0,
                        paddingRight: 8,
                        borderTop: `1px solid ${colors.line}`,
                        background: colors.headerBackground
                    }}
                >
                    <ToolOverflow
                        items={items}
                        active={selected}
                        onSelect={setSelected}
                    />
                    <WebMcpLink />
                </footer>
            </main>
        </ThemeProvider>
    );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
