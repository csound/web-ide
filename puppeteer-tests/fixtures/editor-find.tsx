import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { setDiagnostics } from "@codemirror/lint";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Editor, { openEditors } from "../../src/components/editor/editor";
import { CodePane } from "../../src/components/score-tools/code-pane";
import HotKeys from "../../src/components/hot-keys/hot-keys";
import HotKeysReducer from "../../src/components/hot-keys/reducer";
import dark from "../../src/styles/_theme-dracula";
import light from "../../src/styles/_theme-github-light";

// Real editor components and global shortcuts, without cloud reads or writes.
const store = configureStore({
    reducer: {
        HotKeysReducer,
        ProjectsReducer: () => ({ projects: { "find-fixture": {} } })
    }
});
const lightMode = new URLSearchParams(location.search).has("light");
const theme = createTheme({
    ...(lightMode ? light : dark),
    font: { regular: "system-ui, sans-serif", monospace: "monospace" }
});
document.body.style.background = theme.background;
document.body.style.color = theme.textColor;
history.replaceState(null, "", "/editor/find-fixture");

(window as any).editorFindFixture = {
    text: (id: string) => openEditors.get(id)?.state.doc.toString(),
    cursorLine: (id: string) => {
        const state = openEditors.get(id)!.state;
        return state.doc.lineAt(state.selection.main.head).number;
    },
    selection: (id: string) => {
        const state = openEditors.get(id)!.state;
        return state.sliceDoc(
            state.selection.main.from,
            state.selection.main.to
        );
    },
    select: (id: string, from: number, to = from) => {
        openEditors
            .get(id)!
            .dispatch({ selection: { anchor: from, head: to } });
    },
    ranges: (id: string) =>
        openEditors
            .get(id)!
            .state.selection.ranges.map(({ from, to }) => ({ from, to })),
    diagnostics: () => {
        const view = openEditors.get("first")!;
        view.dispatch(
            setDiagnostics(view.state, [
                {
                    from: 2,
                    to: 11,
                    severity: "error",
                    message: "Example error"
                },
                {
                    from: 12,
                    to: 17,
                    severity: "warning",
                    message: "Example warning"
                }
            ])
        );
    },
    lastFindPrevented: undefined
};
document.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "f" && (event.metaKey || event.ctrlKey))
        (window as any).editorFindFixture.lastFindPrevented =
            event.defaultPrevented;
});

function Source({
    id,
    value,
    filename = `${id}.csd`
}: {
    id: string;
    value: string;
    filename?: string;
}) {
    const [text, setText] = useState(value);
    return (
        <section data-editor={id}>
            <h2>{filename}</h2>
            <div className="editor-host">
                <Editor
                    documentUid={id}
                    projectUid="find-fixture"
                    buffer={{ filename, value: text }}
                    onBufferChange={setText}
                />
            </div>
        </section>
    );
}

function Fixture() {
    const [source, setSource] = useState("i1 0 1\ni2 1 1");
    return (
        <HotKeys>
            <main>
                <header>
                    <label>
                        Outside editor <input aria-label="Outside editor" />
                    </label>
                </header>
                <Source
                    id="first"
                    filename="first.orc"
                    value={
                        "; untouched alpha\ninstr 1\n  aSignal oscili 0.1, 440\nendin"
                    }
                />
                <Source
                    id="second"
                    value={
                        "; alpha ALPHA alphabet alpha\n; tone12 tone34\ninstr 2\nendin"
                    }
                />
                <section data-editor="tool-source">
                    <h2>Tool source</h2>
                    <div className="editor-host">
                        <CodePane
                            value={source}
                            label="Tool source"
                            language={[]}
                            onChange={setSource}
                        />
                    </div>
                </section>
                <section data-editor="tool-output">
                    <h2>Tool output (read only)</h2>
                    <div className="editor-host">
                        <CodePane
                            value={"i1 0 1\ni2 1 1"}
                            label="Tool output"
                            language={[]}
                        />
                    </div>
                </section>
            </main>
        </HotKeys>
    );
}

createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
        <ThemeProvider theme={theme}>
            <Fixture />
        </ThemeProvider>
    </Provider>
);
