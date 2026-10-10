import { afterEach, expect, it, vi } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import {
    CompletionContext,
    type CompletionSource
} from "@codemirror/autocomplete";
import { csoundEditorLanguage } from "../csound-language";
import {
    setUdoDeclarations,
    setPartialUdoDeclarations,
    setPluginSignatures,
    setPluginTypes,
    udoCatalog
} from "./udos";
import type { UdoDeclaration } from "./types";

let view: EditorView;
afterEach(() => view?.destroy());
const voice: UdoDeclaration = {
    name: "IncludedVoice",
    filename: "voices/lead.udo",
    line: 1,
    inputs: [{ name: "frequency", type: "i" }],
    outputs: ["a"]
};

it("shows plugin type names in synopsis and replaces type completion when metadata changes", async () => {
    view = new EditorView({
        parent: document.body,
        state: EditorState.create({
            doc: "voice:Pl",
            selection: { anchor: 8 },
            extensions: csoundEditorLanguage("orc")
        })
    });
    view.dispatch({
        effects: [
            setPluginTypes.of([
                { name: "PluginVoice", argtype: 0, struct: false, members: [] }
            ]),
            setPluginSignatures.of([
                {
                    opname: "plugin_read",
                    intypes: ":PluginVoice;",
                    outypes: "k"
                }
            ])
        ]
    });
    expect(await completions()).toEqual([
        { label: "PluginVoice", type: "type", detail: "Plugin object" }
    ]);
    expect(
        view.state.field(udoCatalog)?.entries.get("plugin_read")?.syntax?.[0]
    ).toBe("k = plugin_read(PluginVoice)");
    view.dispatch({ effects: setPluginTypes.of([]) });
    expect(
        (await completions())?.some((entry) => entry.label === "PluginVoice")
    ).toBe(false);
});

it("shares plugin overloads with completion and synopsis, and removes plugins without dropping confirmed UDOs", async () => {
    view = new EditorView({
        parent: document.body,
        state: EditorState.create({
            doc: "a1 = mult(0.1, 440)",
            selection: { anchor: 17 },
            extensions: csoundEditorLanguage("orc")
        })
    });
    view.dispatch({
        effects: [
            setUdoDeclarations.of([voice]),
            setPluginSignatures.of([
                { opname: "mult.aa", outypes: "a", intypes: "aa" },
                { opname: "mult.kk", outypes: "k", intypes: "kk" }
            ])
        ]
    });
    expect(
        view.state.field(udoCatalog)?.entries.get("mult")?.signatures
    ).toHaveLength(2);
    expect(
        (await completions())?.filter((entry) => entry.label === "mult")
    ).toHaveLength(1);
    expect(
        (await completions())?.find((entry) => entry.label === "mult")?.detail
    ).toBe("a = mult(a, a)");
    await vi.waitFor(() =>
        expect(
            view.dom.querySelector(".cm-csound-synopsis")?.textContent
        ).toContain("mult")
    );
    view.dispatch({
        effects: [setPluginSignatures.of([]), setPartialUdoDeclarations.of([])]
    });
    expect([...view.state.field(udoCatalog)!.entries.keys()]).toEqual([
        "IncludedVoice"
    ]);
});

it("keeps confirmed symbols through failed checks until another successful check", () => {
    let state = EditorState.create({ extensions: udoCatalog });
    state = state.update({ effects: setUdoDeclarations.of([voice]) }).state;
    const draft = { ...voice, name: "DraftVoice" };
    state = state.update({
        effects: setPartialUdoDeclarations.of([draft])
    }).state;
    expect([...state.field(udoCatalog)!.entries.keys()]).toEqual([
        "DraftVoice",
        "IncludedVoice"
    ]);
    state = state.update({ effects: setPartialUdoDeclarations.of([]) }).state;
    expect([...state.field(udoCatalog)!.entries.keys()]).toEqual([
        "IncludedVoice"
    ]);
    state = state.update({ effects: setUdoDeclarations.of([draft]) }).state;
    expect([...state.field(udoCatalog)!.entries.keys()]).toEqual([
        "DraftVoice"
    ]);
    state = state.update({ effects: setUdoDeclarations.of([]) }).state;
    expect(state.field(udoCatalog)!.entries.size).toBe(0);
});

it("keeps confirmed overloads and uses fresh parameter names from a partial check", () => {
    let state = EditorState.create({ extensions: udoCatalog });
    const overload = { ...voice, inputs: [{ name: "signal", type: "a" }] };
    state = state.update({
        effects: setUdoDeclarations.of([voice, overload])
    }).state;
    state = state.update({
        effects: setPartialUdoDeclarations.of([
            { ...voice, inputs: [{ name: "pitch", type: "i" }] }
        ])
    }).state;
    expect(
        state.field(udoCatalog)?.entries.get(voice.name)?.signatures
    ).toHaveLength(2);
    expect(state.field(udoCatalog)?.entries.get(voice.name)?.syntax?.[0]).toBe(
        "a = IncludedVoice(pitch:i)"
    );
});

async function completions() {
    const [source] = view.state.languageDataAt<CompletionSource>(
        "autocomplete",
        view.state.selection.main.head
    );
    return (
        await source(
            new CompletionContext(
                view.state,
                view.state.selection.main.head,
                true
            )
        )
    )?.options;
}

it("uses one catalog for included UDO completion, legacy highlighting and synopsis", async () => {
    const doc = '#include "voices/lead.udo"\na1 IncludedVoice 440\n';
    view = new EditorView({
        parent: document.body,
        state: EditorState.create({
            doc,
            selection: { anchor: doc.indexOf("440") },
            extensions: csoundEditorLanguage("orc")
        })
    });
    view.dispatch({ effects: setUdoDeclarations.of([voice]) });
    expect(
        (await completions())?.find((item) => item.label === voice.name)
    ).toMatchObject({
        detail: "a = IncludedVoice(frequency:i)",
        boost: 20
    });
    await vi.waitFor(() => {
        expect(
            [...view.contentDOM.querySelectorAll(".cm-csound-opcode")].some(
                (node) => node.textContent === voice.name
            )
        ).toBe(true);
        expect(
            view.dom.querySelector(".cm-csound-synopsis strong")?.textContent
        ).toBe("frequency");
    });

    view.dispatch({
        effects: setUdoDeclarations.of([
            { ...voice, inputs: [{ name: "pitch", type: "k" }] }
        ])
    });
    expect(
        (await completions())?.find((item) => item.label === voice.name)?.detail
    ).toBe("a = IncludedVoice(pitch:k)");
    expect(
        view.dom.querySelector(".cm-csound-synopsis strong")?.textContent
    ).toBe("pitch");

    view.dispatch({
        effects: setUdoDeclarations.of([{ ...voice, name: "RenamedVoice" }])
    });
    expect(
        (await completions())?.some((item) => item.label === voice.name)
    ).toBe(false);
    expect(view.state.field(udoCatalog)?.entries.has("RenamedVoice")).toBe(
        true
    );
    await vi.waitFor(() =>
        expect(view.dom.querySelector(".cm-csound-synopsis")?.textContent).toBe(
            ""
        )
    );
    view.dispatch({ effects: setUdoDeclarations.of([]) });
    expect(view.state.field(udoCatalog)?.entries.size).toBe(0);
});

it("uses parser scope instead of suggesting an inactive definition from raw text", async () => {
    const doc =
        "#ifdef DISABLED\nopcode Hidden():a\nxout 0\nendop\n#endif\na1 = Hidd";
    view = new EditorView({
        parent: document.body,
        state: EditorState.create({
            doc,
            selection: { anchor: doc.length },
            extensions: csoundEditorLanguage("orc")
        })
    });
    view.dispatch({ effects: setUdoDeclarations.of([]) });
    expect((await completions())?.some((item) => item.label === "Hidden")).toBe(
        false
    );
});
