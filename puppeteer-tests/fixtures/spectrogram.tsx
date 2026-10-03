// Local Csound only. No database reads or writes.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { store } from "../../src/store";
import SpectralAnalyzer from "../../src/components/spectral-analyzer/spectral-analyzer";
import {
    runPerformance,
    stopPerformance,
    pauseCsound,
    resumePausedCsound
} from "../../src/components/csound/actions";
import dark from "../../src/styles/_theme-dracula";
import light from "../../src/styles/_theme-github-light";

const parameters = new URLSearchParams(location.search);
const colors = parameters.has("light") ? light : dark;
const theme = createTheme({
    ...colors,
    font: { regular: "sans-serif", monospace: "monospace" }
});
const projectUid = "spectrogram-fixture";
store.dispatch({
    type: "PROJECTS.STORE_PROJECT_LOCALLY",
    projects: [{ projectUid, documents: {} }]
});
store.dispatch({ type: "PROJECTS.ACTIVATE_PROJECT", projectUid });
localStorage.setItem("sab", parameters.has("worker") ? "true" : "false");

function Fixture() {
    const [visible, setVisible] = useState(true);
    return (
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <main
                    style={{
                        background: colors.background,
                        color: colors.textColor,
                        padding: 16,
                        fontFamily: "sans-serif"
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            marginBottom: 16,
                            flexWrap: "wrap"
                        }}
                    >
                        <button
                            onClick={() =>
                                void runPerformance({
                                    projectUid,
                                    setConsole: () => {},
                                    orc: `
sr = 48000
ksmps = 32
nchnls = 2
0dbfs = 1
instr 1
 aTone oscili 0.1, 1000
 ${
     parameters.has("tone")
         ? ""
         : `
 kPosition oscili 0.5, 0.12
 kSweep = 60 * pow(200, kPosition + 0.5)
 aSweep oscili 0.06, kSweep
 aBass vco2 0.03, 110
 aTone += aSweep + aBass
 `
 }
 outs aTone, aTone
endin
schedule(1, 0, -1)
`
                                })
                            }
                        >
                            Run
                        </button>
                        <button onClick={() => store.dispatch(pauseCsound())}>
                            Pause audio
                        </button>
                        <button
                            onClick={() => store.dispatch(resumePausedCsound())}
                        >
                            Resume audio
                        </button>
                        <button onClick={() => void stopPerformance()}>
                            Stop
                        </button>
                        <button onClick={() => setVisible((value) => !value)}>
                            Toggle panel
                        </button>
                    </div>
                    <div
                        data-testid="analyzer-panel"
                        style={{
                            width: "100%",
                            height: parameters.has("short") ? 190 : 360,
                            resize: "both",
                            overflow: "hidden",
                            border: `1px solid ${colors.line}`
                        }}
                    >
                        {visible && <SpectralAnalyzer />}
                    </div>
                </main>
            </ThemeProvider>
        </Provider>
    );
}

createRoot(document.getElementById("root")!).render(<Fixture />);
