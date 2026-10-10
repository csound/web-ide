import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { store } from "../../src/store";
import CodeEditor, { openEditors } from "../../src/components/editor/editor";
import { plotterAvailable } from "../../src/components/editor/ftgen/client";
import dark from "../../src/styles/_theme-dracula";
import light from "../../src/styles/_theme-github-light";
const colors = new URLSearchParams(location.search).has("light") ? light : dark;
const source = `<CsoundSynthesizer>
<CsInstruments>
sr = 48000

; Hover a table name and click to inspect its shape.
gi_tales_trisaw ftgen 0,0,1024,7,1,5,-0.6,246,0.3,5,-0.3,251,0.6,5,-1,512,1

gi_window ftgen 0,0,8192,20,2

instr 1
endin
</CsInstruments>
<CsScore>
f 1 0 8192 10 1 .5 .25 .125
</CsScore>
</CsoundSynthesizer>`;
(window as any).ftgenFixture = {
    available: plotterAvailable,
    text: () => openEditors.get("ftgen-fixture")?.state.doc.toString(),
    replace: (find: string, insert: string) => {
        const view = openEditors.get("ftgen-fixture")!;
        const from = view.state.doc.toString().indexOf(find);
        view.dispatch({ changes: { from, to: from + find.length, insert } });
    }
};
document.body.style.background = colors.background;
createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
        <ThemeProvider
            theme={createTheme({
                ...colors,
                font: {
                    regular: '"Roboto", sans-serif',
                    monospace: '"Roboto Mono", monospace'
                }
            })}
        >
            <div style={{ height: "100dvh" }}>
                <CodeEditor
                    projectUid="ftgen-local"
                    documentUid="ftgen-fixture"
                    onBufferChange={() => {}}
                    buffer={{ filename: "tables.csd", value: source }}
                />
            </div>
        </ThemeProvider>
    </Provider>
);
