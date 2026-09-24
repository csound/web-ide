import { EditorState, type Extension } from "@codemirror/state";
import {
    autocompletion,
    startCompletion,
    currentCompletions,
    setSelectedCompletion,
    acceptCompletion,
    CompletionContext,
    type CompletionSource
} from "@codemirror/autocomplete";
import { csoundCompletionSource } from "@kunstmusik/codemirror-lang-csound";
import { EditorView } from "@codemirror/view";
import { indentUnit, syntaxTree } from "@codemirror/language";
import { afterEach, describe, expect, it, vi } from "vitest";
import { csoundEditorLanguage } from "./csound-language";

const views: EditorView[] = [];
afterEach(() => {
    for (const view of views.splice(0)) {
        view.destroy();
    }
});

function editor(
    doc: string,
    fileType = "orc",
    position = 0,
    extensions: Extension[] = []
) {
    const view = new EditorView({
        state: EditorState.create({
            doc,
            selection: { anchor: position },
            extensions: [csoundEditorLanguage(fileType), ...extensions]
        }),
        parent: document.body
    });
    views.push(view);
    return view;
}

function marked(view: EditorView, className: string, token: string) {
    return Array.from(view.contentDOM.querySelectorAll("." + className)).find(
        (node) => node.textContent === token
    );
}

describe("the IDE Csound adapter", () => {
    it("shows descriptions beside opcode completions without a second info popup", async () => {
        const doc = "a1 = oscil";
        const view = editor(doc, "orc", doc.length, [
            autocompletion({ activateOnTyping: false, interactionDelay: 0 })
        ]);
        view.focus();
        startCompletion(view);
        await vi.waitFor(() => {
            const completion = currentCompletions(view.state).find(
                (entry) => entry.label === "oscili"
            );
            expect(completion?.detail).toBe(
                "A simple oscillator with linear interpolation."
            );
            expect(completion?.info).toBeUndefined();
        });
        const index = currentCompletions(view.state).findIndex(
            (entry) => entry.label === "oscili"
        );
        view.dispatch({ effects: setSelectedCompletion(index) });
        await vi.waitFor(() => {
            const row = view.dom.querySelector(
                '.cm-tooltip-autocomplete li[aria-selected="true"]'
            );
            expect(row?.querySelector(".cm-completionLabel")?.textContent).toBe(
                "oscili"
            );
            expect(
                row?.querySelector(".cm-completionDetail")?.textContent
            ).toBe("A simple oscillator with linear interpolation.");
            expect(view.dom.querySelector(".cm-completionInfo")).toBeNull();
        });
        expect(acceptCompletion(view)).toBe(true);
        expect(view.state.doc.toString()).toBe("a1 = oscili");
    });

    it("keeps UDO priority and insertion without category filler or changing upstream options", async () => {
        const doc =
            "opcode localPass(signal:a):a\n xout(signal)\nendop\na1 = loc";
        const view = editor(doc, "orc", doc.length, [
            autocompletion({ activateOnTyping: false, interactionDelay: 0 })
        ]);
        const context = new CompletionContext(view.state, doc.length, true);
        const sources = view.state.languageDataAt<CompletionSource>(
            "autocomplete",
            doc.length
        );
        expect(sources).toHaveLength(1);
        const result = await sources[0](context);
        const udo = result?.options.find(
            (entry) => entry.label === "localPass"
        );
        expect(udo).toMatchObject({
            label: "localPass",
            type: "function",
            boost: 20
        });
        expect(udo?.detail).toBeUndefined();
        expect(udo?.info).toBeUndefined();
        const upstream = csoundCompletionSource(context)?.options.find(
            (entry) => entry.label === "oscili"
        );
        expect(upstream?.detail).toContain("Csound opcode");
        expect(upstream?.info).toBe(
            "A simple oscillator with linear interpolation."
        );
        view.focus();
        startCompletion(view);
        await vi.waitFor(() =>
            expect(currentCompletions(view.state)[0]?.label).toBe("localPass")
        );
        expect(acceptCompletion(view)).toBe(true);
        expect(view.state.doc.toString()).toBe(doc.slice(0, -3) + "localPass");
    });

    it("chooses the core language and the IDE's indentation and completion", () => {
        for (const [fileType, top] of [
            ["csd", "CsdFile"],
            ["orc", "OrchestraFile"],
            ["sco", "ScoreFile"],
            ["udo", "OrchestraFile"]
        ]) {
            const state = EditorState.create({
                extensions: [csoundEditorLanguage(fileType)]
            });
            expect(syntaxTree(state).topNode.name).toBe(top);
            expect(state.facet(indentUnit)).toBe("  ");
            expect(state.languageDataAt("autocomplete", 0)).toHaveLength(1);
        }
    });

    it("supplies the CSS hooks used by the IDE themes, including the whole 0dbfs token", () => {
        const view = editor(
            [
                "0dbfs = 1",
                "#define LEVEL #0.2#",
                "gaSig init 0",
                "instr 1",
                "  aSig oscili $LEVEL, 440",
                "  kRate = 1",
                '  SText = "hi"',
                "  fSpec pvsanal aSig, 1024, 256, 1024, 1",
                "  kTime = p3",
                "  if kRate > 0 then",
                "    out aSig",
                "  endif",
                "endin",
                ""
            ].join("\n")
        );
        const expected = {
            "cm-csound-define": "instr",
            "cm-csound-control-flow": "if",
            "cm-csound-opcode": "oscili",
            "cm-csound-global-var": "gaSig",
            "cm-csound-a-rate-var": "aSig",
            "cm-csound-k-rate-var": "kRate",
            "cm-csound-s-rate-var": "SText",
            "cm-csound-f-rate-var": "fSpec",
            "cm-csound-p-field-var": "p3",
            "cm-csound-global-constant": "0dbfs",
            "cm-csound-macro-token": "$LEVEL"
        };
        for (const [className, token] of Object.entries(expected)) {
            expect(marked(view, className, token), className).toBeDefined();
        }
        view.dispatch({ changes: { from: 0, to: 5, insert: "nchnls" } });
        expect(
            marked(view, "cm-csound-global-constant", "nchnls")
        ).toBeDefined();
        expect(view.dom.querySelector(".cm-csoundBuiltinOpcode")).toBeNull();
    });

    it("uses explicit types before legacy prefixes and skips member names", () => {
        const view = editor(
            'voice@global:a init 0\ncounter:k = 1\ntext@global:S = "hi"\nvalue = point.field\n'
        );
        expect(
            marked(view, "cm-csound-global-var", "voice@global:a")
        ).toBeDefined();
        expect(
            marked(view, "cm-csound-a-rate-var", "voice@global:a")
        ).toBeDefined();
        expect(marked(view, "cm-csound-k-rate-var", "counter:k")).toBeDefined();
        expect(
            marked(view, "cm-csound-s-rate-var", "text@global:S")
        ).toBeDefined();
        expect(marked(view, "cm-csound-f-rate-var", "field")).toBeUndefined();
    });

    it.each([
        ["a1 oscili 0.2, 440", "ares oscili xamp, xcps[, ifn, iphs]", "xcps"],
        [
            "a1 = oscili:a(0.2, 440)",
            "ares = oscili:a(xamp, xcps[, ifn, iphs])",
            "xcps"
        ],
        ["k1 oscili 0.2, 440", "kres oscili kamp, kcps[, ifn, iphs]", "kcps"]
    ])(
        "matches the call style and rate in %s",
        async (line, syntax, active) => {
            const view = editor(line + "\n", "orc", line.indexOf("440"));
            const panel = view.dom.querySelector(
                ".cm-panels-bottom .cm-csound-synopsis"
            );
            expect(panel?.getAttribute("role")).toBe("status");
            await vi.waitFor(() => {
                expect(
                    panel?.querySelector(".cm-csound-opcode")?.textContent
                ).toBe("oscili");
                expect(panel?.textContent).toBe(syntax);
                expect(panel?.querySelector("strong")?.textContent).toBe(
                    active
                );
            });
        }
    );

    it.each(["a1 oscili 0.2, 440, 1, 0", "a1 = oscili:a(0.2, 440, 1, 0)"])(
        "tracks cursor moves through required and optional inputs in %s",
        async (line) => {
            const view = editor(line + "\n", "orc", line.indexOf("0.2"));
            const panel = view.dom.querySelector(".cm-csound-synopsis");
            const comma = line.indexOf(",");
            for (const [position, active] of [
                [line.indexOf("0.2"), "xamp"],
                [comma, "xamp"],
                [comma + 1, "xcps"],
                [line.indexOf("440"), "xcps"],
                [line.indexOf(", 1") + 2, "ifn"],
                [line.lastIndexOf(", 0") + 2, "iphs"]
            ] as const) {
                view.dispatch({ selection: { anchor: position } });
                await vi.waitFor(() => {
                    expect(panel?.querySelectorAll("strong")).toHaveLength(1);
                    expect(panel?.querySelector("strong")?.textContent).toBe(
                        active
                    );
                });
            }
            view.dispatch({ selection: { anchor: line.indexOf("oscili") } });
            await vi.waitFor(() => {
                expect(
                    panel?.querySelector(".cm-csound-opcode")?.textContent
                ).toBe("oscili");
                expect(panel?.querySelector("strong")).toBeNull();
            });
        }
    );

    it.each([
        ["a1 oscili max(0.1, 0.2), 440", "440", "xcps"],
        ["a1 = oscili:a(max(0.1, 0.2), 440)", "440", "xcps"],
        ["a1 oscili values[limit(1, 2, 3)], 440", "440", "xcps"],
        ["a1 oscili 0.2 /* a, b */, 440", "440", "xcps"],
        ["a1 = oscili:a(\n 0.2, ; a, b\n 440\n)", "440", "xcps"],
        ["a1 oscili 0.2, \\\n 440", "440", "xcps"],
        ['printf "a,b", 1, 2', "1", "ktrig"],
        ['printf("a,b", 1, 2)', "1", "ktrig"],
        ["printf {{a,b}}, 1, 2", "1", "ktrig"],
        ['printf "a,\\"b,c", 1, 2', "1", "ktrig"],
        ["out a1, a2", "a2", "asig2"],
        ["out(a1, a2)", "a2", "asig2"]
    ])("ignores nested separators in %s", async (line, at, active) => {
        const view = editor(line + "\n", "orc", line.indexOf(at));
        await vi.waitFor(() =>
            expect(
                view.dom.querySelector(".cm-csound-synopsis strong")
                    ?.textContent
            ).toBe(active)
        );
    });

    it.each(["a1 oscili 0.2, ", "a1 = oscili:a(0.2, "])(
        "tracks an empty argument while typing %s",
        async (line) => {
            const view = editor(line, "orc", line.length);
            await vi.waitFor(() =>
                expect(
                    view.dom.querySelector(".cm-csound-synopsis strong")
                        ?.textContent
                ).toBe("xcps")
            );
        }
    );

    it.each([
        "a1 oscili max(0.1, 0.2), 440",
        "a1 = oscili:a(max(0.1, 0.2), 440)"
    ])(
        "tracks the innermost call and returns to its parent in %s",
        async (line) => {
            const view = editor(line + "\n", "orc", line.indexOf("0.2"));
            const panel = view.dom.querySelector(".cm-csound-synopsis");
            for (const [position, opcode, active] of [
                [line.indexOf("0.2"), "max", "ain2"],
                [line.indexOf("),") + 1, "oscili", "xamp"],
                [line.indexOf("440"), "oscili", "xcps"]
            ] as const) {
                view.dispatch({ selection: { anchor: position } });
                await vi.waitFor(() => {
                    expect(
                        panel?.querySelector(".cm-csound-opcode")?.textContent
                    ).toBe(opcode);
                    expect(panel?.querySelector("strong")?.textContent).toBe(
                        active
                    );
                });
            }
        }
    );

    it("converts a valid legacy synopsis when the catalog's function form is malformed", async () => {
        const line = "k1 = pow:k(2, 3)";
        const view = editor(line + "\n", "orc", line.indexOf("3"));
        await vi.waitFor(() => {
            const panel = view.dom.querySelector(".cm-csound-synopsis");
            expect(panel?.textContent).toBe(
                "kres = pow:k(karg, kpow [, inorm])"
            );
            expect(panel?.querySelector("strong")?.textContent).toBe("kpow");
        });
    });

    it.each([
        ["a1 localPass 0.2, 440", "a localPass a, k"],
        ["a1 = localPass:a(0.2, 440)", "a = localPass:a(a, k)"]
    ])(
        "tracks UDO arguments without manual syntax in %s",
        async (line, syntax) => {
            const doc =
                "opcode localPass(signal:a, frequency:k):a\n xout(signal)\nendop\n" +
                line +
                "\n";
            const view = editor(doc, "orc", doc.indexOf("440"));
            await vi.waitFor(() => {
                const panel = view.dom.querySelector(".cm-csound-synopsis");
                expect(panel?.textContent).toBe(syntax);
                expect(panel?.querySelector("strong")?.textContent).toBe("k");
            });
        }
    );

    it("updates the active argument and call style after edits", async () => {
        const line = "a1 oscili 0.2, 440";
        const position = line.indexOf("440");
        const view = editor(line + "\n", "orc", position);
        const panel = view.dom.querySelector(".cm-csound-synopsis");
        await vi.waitFor(() =>
            expect(panel?.querySelector("strong")?.textContent).toBe("xcps")
        );
        view.dispatch({
            changes: { from: position, insert: "1, " },
            selection: { anchor: position + 3 }
        });
        await vi.waitFor(() =>
            expect(panel?.querySelector("strong")?.textContent).toBe("ifn")
        );
        const modern = "a1 = oscili:a(0.2, 440)";
        view.dispatch({
            changes: {
                from: 0,
                to: view.state.doc.length,
                insert: modern + "\n"
            },
            selection: { anchor: modern.indexOf("440") }
        });
        await vi.waitFor(() => {
            expect(panel?.textContent).toBe(
                "ares = oscili:a(xamp, xcps[, ifn, iphs])"
            );
            expect(panel?.querySelector("strong")?.textContent).toBe("xcps");
        });
    });

    it("updates UDO help on edits and clears stale results when the cursor moves", async () => {
        const doc =
            "opcode localPass(signal:a):a\n  xout(signal)\nendop\naSig = localPass(0.2)\n\n";
        const position = doc.indexOf("0.2");
        const view = editor(doc, "orc", position);
        const panel = view.dom.querySelector(".cm-csound-synopsis");
        await vi.waitFor(() =>
            expect(panel?.textContent).toContain("localPass")
        );
        const call = doc.lastIndexOf("localPass");
        view.dispatch({
            changes: {
                from: call,
                to: call + "localPass".length,
                insert: "unknownCall"
            }
        });
        await vi.waitFor(() => expect(panel?.textContent).toBe(""));
        view.dispatch({
            changes: {
                from: call,
                to: call + "unknownCall".length,
                insert: "localPass"
            },
            selection: { anchor: position }
        });
        view.dispatch({ selection: { anchor: view.state.doc.length } });
        await Promise.resolve();
        await Promise.resolve();
        expect(panel?.textContent).toBe("");
    });
});
