import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { EditorView } from "@codemirror/view";
import QueueMusicRounded from "@mui/icons-material/QueueMusicRounded";
import ScoreTool from "../../src/components/score-tools/score-tool";
import dark from "../../src/styles/_theme-dracula";
import light from "../../src/styles/_theme-github-light";

const colors = new URLSearchParams(location.search).has("light") ? light : dark;
const theme = createTheme({
    ...colors,
    font: { regular: "sans-serif", monospace: "monospace" }
});
(window as any).editScore = (source: string) => {
    const element = document.querySelector('[aria-label="Score source"]')!;
    const view = EditorView.findFromDOM(element)!;
    view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: source }
    });
};
(window as any).readScore = () =>
    EditorView.findFromDOM(
        document.querySelector('[aria-label="Generated score"]')!
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
                        <ScoreTool />
                    ) : (
                        <p style={{ padding: 24 }}>
                            Open the score converter below.
                        </p>
                    )}
                </div>
                <footer
                    style={{
                        display: "flex",
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
                        <QueueMusicRounded fontSize="small" />
                        Score Converter
                    </button>
                </footer>
            </main>
        </ThemeProvider>
    );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
