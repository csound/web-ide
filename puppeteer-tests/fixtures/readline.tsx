// Local fixture: real console, performance lifecycle, and linked WASM; no cloud project.
import React, { useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Console from "../../src/components/console/console";
import { ConsoleContext } from "../../src/components/console/context";
import {
    runPerformance,
    stopPerformance
} from "../../src/components/csound/actions";
import { store } from "../../src/store";
import dark from "../../src/styles/_theme-dracula";
import light from "../../src/styles/_theme-github-light";
import source from "./readline.csd?raw";

const params = new URLSearchParams(location.search);
const colors = params.get("theme") === "light" ? light : dark;
const theme = createTheme({
    ...colors,
    font: { monospace: "monospace", regular: "sans-serif" }
});
document.body.style.cssText = `margin:0;background:${colors.background};color:${colors.textColor};font-family:sans-serif`;
localStorage.setItem("sab", params.get("worker") === "true" ? "true" : "false");
const text =
    params.get("empty") === "true" ? source.replace('"input> "', '""') : source;
store.dispatch({
    type: "PROJECTS.STORE_PROJECT_LOCALLY",
    projects: [
        {
            projectUid: "readline-fixture",
            documents: {
                csd: {
                    documentUid: "csd",
                    filename: "readline.csd",
                    path: [],
                    type: "txt",
                    currentValue: text
                }
            }
        }
    ]
});
store.dispatch({
    type: "PROJECTS.ACTIVATE_PROJECT",
    projectUid: "readline-fixture"
});

function Fixture() {
    const [logs, setLogs] = useState<string[]>([]);
    const [error, setError] = useState("");
    const status = useSyncExternalStore(
        store.subscribe,
        () => store.getState().csound.status
    );
    const busy = ["loading", "playing", "paused", "rendering"].includes(status);
    return (
        <ThemeProvider theme={theme}>
            <header
                style={{
                    padding: 12,
                    display: "flex",
                    gap: 12,
                    alignItems: "center"
                }}
            >
                <strong>Readline check</strong>
                <button
                    disabled={busy}
                    onClick={() => {
                        setError("");
                        void runPerformance({
                            projectUid: "readline-fixture",
                            csdPath: "readline.csd",
                            setConsole: setLogs
                        }).catch((e) => setError(String(e)));
                    }}
                >
                    Start
                </button>
                <button disabled={!busy} onClick={() => void stopPerformance()}>
                    Stop
                </button>
            </header>
            {error && <div role="alert">{error}</div>}
            <main style={{ height: "calc(100dvh - 48px)", minHeight: 0 }}>
                <ConsoleContext.Provider value={logs}>
                    <Console />
                </ConsoleContext.Provider>
            </main>
        </ThemeProvider>
    );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
