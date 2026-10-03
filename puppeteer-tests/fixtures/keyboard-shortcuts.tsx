// Local project and silent audio: no cloud reads or writes.
import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { EditorView, basicSetup } from "codemirror";
import { store, useSelector } from "../../src/store";
import HotKeys from "../../src/components/hot-keys/hot-keys";
import { storeProjectEditorKeyboardCallbacks } from "../../src/components/hot-keys/actions";
import {
    ConsoleProvider,
    useSetConsole
} from "../../src/components/console/context";
import Console from "../../src/components/console/console";
import PlayButton from "../../src/components/target-controls/play-button";
import { stopCsound } from "../../src/components/csound/actions";
import colors from "../../src/styles/_theme-dracula";

const projectUid = "keyboard-fixture";
const csd = `<CsoundSynthesizer>
<CsOptions>
-odac -m0
</CsOptions>
<CsInstruments>
sr = 48000
ksmps = 32
nchnls = 2
0dbfs = 1
instr 1
  asilent init 0
  outs asilent, asilent
endin
</CsInstruments>
<CsScore>
i1 0 3600
</CsScore>
</CsoundSynthesizer>`;
store.dispatch({
    type: "PROJECTS.STORE_PROJECT_LOCALLY",
    projects: [
        {
            projectUid,
            userUid: "fixture-author",
            documents: {
                csd: {
                    documentUid: "csd",
                    filename: "project.csd",
                    path: [],
                    type: "txt",
                    currentValue: csd
                }
            }
        }
    ]
});
store.dispatch({ type: "PROJECTS.ACTIVATE_PROJECT", projectUid });
localStorage.setItem(
    "sab",
    new URLSearchParams(location.search).get("worker") || "false"
);

function Fixture() {
    const setConsole = useSetConsole();
    const status = useSelector((state) => state.csound.status);
    const editorElement = useRef<HTMLDivElement>(null);
    useEffect(() => {
        storeProjectEditorKeyboardCallbacks(projectUid, setConsole);
        const editor = new EditorView({
            parent: editorElement.current!,
            doc: "; Use the playback shortcuts here",
            extensions: [basicSetup]
        });
        return () => editor.destroy();
    }, [setConsole]);
    return (
        <HotKeys>
            <>
                <output data-testid="status">{status}</output>
                <PlayButton activeProjectUid={projectUid} isOwner={false} />
                <button onClick={() => void store.dispatch(stopCsound())}>
                    Stop
                </button>
                <div ref={editorElement} />
                <div style={{ height: 300 }}>
                    <Console />
                </div>
            </>
        </HotKeys>
    );
}

createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
        <ThemeProvider
            theme={createTheme({
                ...colors,
                font: { regular: "sans-serif", monospace: "monospace" }
            })}
        >
            <ConsoleProvider>
                <Fixture />
            </ConsoleProvider>
        </ThemeProvider>
    </Provider>
);
