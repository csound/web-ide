import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { AudioFilePreview } from "../../src/components/audio-editor/file-preview";
import { encodeAudio } from "../../src/components/audio-tools/audio";
import light from "../../src/styles/_theme-github-light";
import dark from "../../src/styles/_theme-dracula";
const colors = new URLSearchParams(location.search).has("light") ? light : dark;
const audio = encodeAudio({
    sampleRate: 22050,
    channels: [0, 1].map((channel) =>
        Float32Array.from(
            { length: 22050 * 4 },
            (_, i) =>
                Math.sin((i * 2 * Math.PI * (220 + channel * 110)) / 22050) *
                (0.2 + 0.15 * Math.cos(i / 3500))
        )
    )
});
const url = URL.createObjectURL(new Blob([audio], { type: "audio/wav" }));
function Fixture() {
    const [saved, setSaved] = useState("");
    return (
        <ThemeProvider
            theme={createTheme({
                ...colors,
                font: { regular: "sans-serif", monospace: "monospace" }
            })}
        >
            <main
                style={{
                    height: "100dvh",
                    background: colors.background,
                    color: colors.textColor
                }}
            >
                {saved && <output aria-label="Saved sample">{saved}</output>}
                <AudioFilePreview
                    url={url}
                    filename="synth-texture.wav"
                    onSave={(file) => {
                        setSaved(`${file.name}: ${file.data.length} bytes`);
                        return file.name;
                    }}
                />
            </main>
        </ThemeProvider>
    );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
