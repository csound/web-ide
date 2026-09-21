import { EditorState } from "@codemirror/state";
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

function editor(doc: string, fileType = "orc", position = 0) {
    const view = new EditorView({
        state: EditorState.create({
            doc,
            selection: { anchor: position },
            extensions: [csoundEditorLanguage(fileType)]
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

    it("renders opcode help in its own bottom panel for both call styles", async () => {
        for (const line of ["a1 oscili 0.2, 440", "a1 = oscili:a(0.2, 440)"]) {
            const view = editor(line + "\n", "orc", line.indexOf("440"));
            const panel = view.dom.querySelector(
                ".cm-panels-bottom .cm-csound-synopsis"
            );
            expect(panel?.getAttribute("role")).toBe("status");
            await vi.waitFor(() => {
                expect(
                    panel?.querySelector(".cm-csound-opcode")?.textContent
                ).toBe("oscili");
                expect(panel?.textContent).toContain("xamp");
            });
        }
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
