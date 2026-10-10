import { EditorState } from "@codemirror/state";
import { EditorView, lineNumbers } from "@codemirror/view";
import { autocompletion, startCompletion } from "@codemirror/autocomplete";
import { forEachDiagnostic } from "@codemirror/lint";
import { csoundEditorLanguage } from "../../src/components/editor/csound-language";
import {
    backgroundValidation,
    sourceFilesChanged
} from "../../src/components/editor/validation/extension";
import { orchestra } from "../../src/components/editor/validation/source";
import { checkerAvailable } from "../../src/components/editor/validation/client";
import { udoCatalog } from "../../src/components/editor/validation/udos";
import { requestedPlugins } from "../../src/components/editor/validation/plugins/options";
import { checkWithPlugins } from "../../src/components/editor/validation/plugins/check";
import { PluginMetadataCache } from "../../src/components/editor/validation/plugins/cache";
import { probePlugins } from "../../src/components/editor/validation/plugins/client";
import cExample from "@csound/wasm-bin/lib/plugin_example.wasm?url";
import cppExample from "@csound/wasm-bin/lib/plugin_example_cpp.wasm?url";
declare const __CSOUND_PLUGIN_TYPES_URL__: string;

let reads = 0;
let probes = 0;
let revision = 1;
const cache = new PluginMetadataCache((bytes, signal) => {
    probes++;
    return probePlugins(bytes, signal);
});
const text = `<CsoundSynthesizer>
<CsOptions>--opcode-lib=c.wasm,cpp.wasm</CsOptions>
<CsInstruments>
instr 1
  a1 = hello440()
  a2 mult a1, a1
endin
</CsInstruments>
<CsScore>i1 0 1</CsScore>
</CsoundSynthesizer>`;
const view = new EditorView({
    parent: document.getElementById("editor")!,
    state: EditorState.create({
        doc: text,
        extensions: [
            csoundEditorLanguage("csd"),
            lineNumbers(),
            autocompletion(),
            EditorView.theme({
                "&": { height: "100vh" },
                ".cm-content": { fontFamily: "monospace", fontSize: "15px" },
                ".cm-gutters": { backgroundColor: "#111217", color: "#aaa" }
            }),
            backgroundValidation(
                (text) => ({
                    filename: "piece.csd",
                    files: [
                        {
                            name: "piece.csd",
                            text: orchestra(text, "piece.csd")!
                        }
                    ],
                    pluginRequests: requestedPlugins(text)
                }),
                (request, signal) =>
                    checkWithPlugins(request, signal, () =>
                        cache.get(
                            "plugin-fixture",
                            request.pluginRequests!.map(({ path }) => ({
                                name: path,
                                revision: String(revision),
                                load: async (signal) => {
                                    reads++;
                                    const response = await fetch(
                                        path === "types.wasm"
                                            ? "/.wasm-build/plugin-types-fixture.wasm"
                                            : path === "c.wasm" || revision > 1
                                              ? cExample
                                              : cppExample,
                                        { signal }
                                    );
                                    return new Uint8Array(
                                        await response.arrayBuffer()
                                    );
                                }
                            }))
                        )
                    )
            )
        ]
    })
});
(window as any).pluginFixture = {
    available: checkerAvailable,
    typesAvailable:
        typeof __CSOUND_PLUGIN_TYPES_URL__ === "string" &&
        Boolean(__CSOUND_PLUGIN_TYPES_URL__),
    text: () => view.state.doc.toString(),
    edit: (text: string) =>
        view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: text }
        }),
    entries: () => [...(view.state.field(udoCatalog)?.entries.keys() ?? [])],
    types: () =>
        view.state.field(udoCatalog)?.types.map((type) => type.name) ?? [],
    useTypes: () =>
        view.dispatch({
            changes: {
                from: 0,
                to: view.state.doc.length,
                insert: `<CsoundSynthesizer>
<CsOptions>--opcode-lib=types.wasm</CsOptions>
<CsInstruments>
instr 1
voice:PluginVoice = plugin_voice(1)
k1 = plugin_read(voice)
pair:PluginPair = plugin_pair()
k2 = pair.level
i1 = pair.notes[0]
endin
</CsInstruments>
<CsScore>i1 0 1</CsScore>
</CsoundSynthesizer>`
            }
        }),
    completeType: () => {
        const anchor =
            view.state.doc.toString().indexOf(":PluginVoice") +
            ":PluginVoice".length;
        view.dispatch({ selection: { anchor } });
        view.focus();
        startCompletion(view);
    },
    diagnostics: () => {
        const errors: string[] = [];
        forEachDiagnostic(view.state, (item) => errors.push(item.message));
        return errors;
    },
    reads: () => reads,
    probes: () => probes,
    complete: () => {
        const anchor = view.state.doc.toString().indexOf("hello440(") + 8;
        view.dispatch({ selection: { anchor } });
        view.focus();
        startCompletion(view);
    },
    replacePlugin: () => {
        revision++;
        view.dispatch({ effects: sourceFilesChanged.of(null) });
    }
};
