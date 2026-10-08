import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { EditorView } from "@codemirror/view";
import MultilineChartRounded from "@mui/icons-material/MultilineChartRounded";
import HetroTool from "../../src/components/hetro-tools/hetro-tool";
import { exampleText } from "../../src/components/hetro-tools/convert";
import type { ToolFile } from "../../src/components/audio-tools/types";
import dark from "../../src/styles/_theme-dracula";
import light from "../../src/styles/_theme-github-light";
const colors = new URLSearchParams(location.search).has("light") ? light : dark;
const theme = createTheme({
    ...colors,
    font: { regular: "sans-serif", monospace: "monospace" }
});
let saved: ToolFile | undefined;
(window as any).editHetro = (text: string) => {
    const view = EditorView.findFromDOM(
        document.querySelector('[aria-label="HETRO text"]')!
    )!;
    view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text }
    });
};
(window as any).readHetro = () =>
    EditorView.findFromDOM(
        document.querySelector('[aria-label="HETRO text"]')!
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
                        <HetroTool
                            sources={[
                                {
                                    id: "text",
                                    name: "partials.txt",
                                    load: async () =>
                                        // Text detection must handle a header beyond the first 32 bytes.
                                        new TextEncoder().encode(
                                            "\uFEFF" +
                                                " \t\r\n".repeat(16) +
                                                exampleText
                                        )
                                },
                                {
                                    id: "saved",
                                    name: "Saved analysis.het",
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
                            Open the HETRO editor below.
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
                        <MultilineChartRounded fontSize="small" />
                        HETRO Editor
                    </button>
                </footer>
            </main>
        </ThemeProvider>
    );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
