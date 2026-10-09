import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import MixerTool from "../../src/components/audio-tools/mixer-tool";
import { encodeAudio } from "../../src/components/audio-tools/audio";
import type { ToolFile } from "../../src/components/audio-tools/types";
import dark from "../../src/styles/_theme-dracula";
import light from "../../src/styles/_theme-github-light";

const colors = new URLSearchParams(location.search).has("light") ? light : dark;
const theme = createTheme({
    ...colors,
    font: { regular: "sans-serif", monospace: "monospace" }
});
const tone = (rate: number, frequency: number) =>
    encodeAudio({
        sampleRate: rate,
        channels: [
            Float32Array.from(
                { length: rate * 2 },
                (_, index) =>
                    0.22 *
                    Math.sin((2 * Math.PI * frequency * index) / rate) *
                    (1 - (index % (rate / 2)) / (rate / 2))
            )
        ]
    });
const initial = [
    { name: "pulse.wav", data: tone(16000, 110) },
    { name: "chimes.wav", data: tone(48000, 660) }
];
function Fixture() {
    const [files, setFiles] = useState<ToolFile[]>(initial);
    return (
        <ThemeProvider theme={theme}>
            <main style={{ height: "100dvh" }}>
                <MixerTool
                    sources={files.map((file) => ({
                        id: file.name,
                        name: file.name,
                        load: async () => file.data
                    }))}
                    onSave={(file) => {
                        setFiles((current) => [...current, file]);
                        return file.name;
                    }}
                />
            </main>
        </ThemeProvider>
    );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
