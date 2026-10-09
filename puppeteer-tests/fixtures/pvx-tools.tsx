import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { EditorView } from "@codemirror/view";
import DataArrayRounded from "@mui/icons-material/DataArrayRounded";
import PvxTool from "../../src/components/pvx-tools/pvx-tool";
import { exampleText } from "../../src/components/pvx-tools/format";
import type { ToolFile } from "../../src/components/audio-tools/types";
import dark from "../../src/styles/_theme-dracula";
import light from "../../src/styles/_theme-github-light";
const colors = new URLSearchParams(location.search).has("light") ? light : dark;
const theme = createTheme({
    ...colors,
    font: { regular: "sans-serif", monospace: "monospace" }
});
let saved: ToolFile | undefined;
(window as any).selectedPvxRow = () => {
    const view = EditorView.findFromDOM(
        document.querySelector('[aria-label="PVX text"]')!
    )!;
    return view.state.doc.lineAt(view.state.selection.main.from).number;
};
(window as any).editPvx = (text: string) => {
    const view = EditorView.findFromDOM(
        document.querySelector('[aria-label="PVX text"]')!
    )!;
    view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text }
    });
};
(window as any).readPvx = () =>
    EditorView.findFromDOM(
        document.querySelector('[aria-label="PVX text"]')!
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
                        <PvxTool
                            sources={[
                                {
                                    id: "text",
                                    name: "frames.txt",
                                    load: async () =>
                                        new TextEncoder().encode(exampleText)
                                },
                                {
                                    id: "saved",
                                    name: "Saved analysis.pvx",
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
                            Open the PVX editor below.
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
                        <DataArrayRounded fontSize="small" />
                        PVX Editor
                    </button>
                </footer>
            </main>
        </ThemeProvider>
    );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
