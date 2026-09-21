import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { afterEach, describe, expect, it, vi } from "vitest";
import { csoundEditorLanguage } from "./csound-language";
import {
    editorEvalCode,
    evalBlinkExtension,
    findSurroundingContext
} from "./utils";

const contextAt = (
    source: string,
    fileType: "csd" | "orc" | "sco",
    search: string
): string | undefined => {
    const state = EditorState.create({
        doc: source,
        extensions: [csoundEditorLanguage(fileType)]
    });
    const position = source.indexOf(search);
    const context = findSurroundingContext(state, position);

    return context && source.slice(context.from, context.to);
};

describe("findSurroundingContext", () => {
    it("returns only a range and kind, not a parser node", () => {
        const source = "instr 1\nout 0\nendin\n";
        const state = EditorState.create({
            doc: source,
            extensions: [csoundEditorLanguage("orc")]
        });
        expect(findSurroundingContext(state, source.indexOf("out"))).toEqual({
            from: 0,
            to: source.trimEnd().length,
            kind: "instrument"
        });
    });

    it("selects a multiline modern UDO, including from a nested conditional", () => {
        const source = [
            "opcode tvöfalda(",
            "  gildi:i",
            "):i",
            "  if gildi > 0 then",
            "    xout(gildi * 2)",
            "  endif",
            "endop",
            ""
        ].join("\n");
        expect(contextAt(source, "orc", "xout")).toBe(source.trimEnd());
    });

    it("selects a declaration and a top-level control block", () => {
        const declaration = "declare split(signal:a):(a,a)\n";
        expect(contextAt(declaration, "orc", "split")).toBe(declaration);
        const control = 'if true then\nprints "ready"\nendif\n';
        expect(contextAt(control, "orc", "prints")).toBe(control.trimEnd());
    });

    it("selects a score statement inside a CSD but not options or XML", () => {
        const source =
            "<CsoundSynthesizer>\n<CsOptions>\n-odac\n</CsOptions>\n<CsScore>\ni 1 0 1\n</CsScore>\n</CsoundSynthesizer>\n";
        expect(contextAt(source, "csd", "i 1")).toBe("i 1 0 1\n");
        expect(contextAt(source, "csd", "-odac")).toBeUndefined();
        expect(contextAt(source, "csd", "<CsoundSynthesizer>")).toBeUndefined();
    });
    it("selects a whole instrument in an orchestra", () => {
        const source = [
            "instr 1",
            "a1 oscili 0.2, 440",
            "out a1",
            "endin",
            ""
        ].join("\n");

        expect(contextAt(source, "orc", "oscili")).toBe(source.trimEnd());
    });

    it("selects a whole legacy UDO", () => {
        const source = [
            "opcode PassThrough, a, a",
            "ain xin",
            "xout ain",
            "endop",
            ""
        ].join("\n");

        expect(contextAt(source, "orc", "xout")).toBe(source.trimEnd());
    });

    it("selects one top-level orchestra statement", () => {
        const source = ["giValue init 1", 'prints "ready"', ""].join("\n");

        expect(contextAt(source, "orc", "prints")).toBe('prints "ready"\n');
    });

    it("selects one score statement", () => {
        const source = ["f 1 0 1024 10 1", "i 1 0 1", ""].join("\n");

        expect(contextAt(source, "sco", "i 1")).toBe("i 1 0 1\n");
    });

    it("selects a whole instrument inside a CSD", () => {
        const instrument = [
            "instr 1",
            "a1 oscili 0.2, 440",
            "out a1",
            "endin"
        ].join("\n");
        const source = [
            "<CsoundSynthesizer>",
            "<CsInstruments>",
            instrument,
            "</CsInstruments>",
            "</CsoundSynthesizer>",
            ""
        ].join("\n");

        expect(contextAt(source, "csd", "oscili")).toBe(instrument);
    });
});

describe("editorEvalCode", () => {
    const views: EditorView[] = [];
    afterEach(() => {
        for (const view of views.splice(0)) view.destroy();
        vi.useRealTimers();
    });

    function setup(doc: string, fileType: string, cursor: string) {
        vi.useFakeTimers();
        const view = new EditorView({
            state: EditorState.create({
                doc,
                selection: { anchor: doc.indexOf(cursor) },
                extensions: [csoundEditorLanguage(fileType), evalBlinkExtension]
            }),
            parent: document.body
        });
        views.push(view);
        const csound = {
            evalCode: vi.fn().mockResolvedValue(0),
            readScore: vi.fn().mockResolvedValue(0)
        };
        return { view, csound };
    }

    it.each([
        ["orc", "instr 1\nout 0\nendin\n", "out", "instr 1\nout 0\nendin"],
        [
            "udo",
            "opcode PassThrough, a, a\nain xin\nxout ain\nendop\n",
            "xout",
            "opcode PassThrough, a, a\nain xin\nxout ain\nendop"
        ],
        [
            "orc",
            "opcode Pass(signal:a):a\nxout(signal)\nendop\n",
            "xout",
            "opcode Pass(signal:a):a\nxout(signal)\nendop"
        ],
        [
            "orc",
            'giValue init 1\nprints "ready"\n',
            "prints",
            'prints "ready"\n'
        ],
        [
            "csd",
            "<CsoundSynthesizer>\n<CsInstruments>\ninstr 1\nout 0\nendin\n</CsInstruments>\n</CsoundSynthesizer>\n",
            "out",
            "instr 1\nout 0\nendin"
        ]
    ])(
        "evaluates the selected %s block through evalCode",
        async (mode, doc, cursor, expected) => {
            const { view, csound } = setup(doc, mode, cursor);
            editorEvalCode(csound, "playing", mode, view, true);
            expect(csound.evalCode).toHaveBeenCalledWith(expected);
            expect(csound.readScore).not.toHaveBeenCalled();
            await vi.advanceTimersByTimeAsync(201);
        }
    );

    it.each([
        ["sco", "f 1 0 1024 10 1\ni 1 0 1\n"],
        [
            "csd",
            "<CsoundSynthesizer>\n<CsScore>\ni 1 0 1\n</CsScore>\n</CsoundSynthesizer>\n"
        ]
    ])(
        "sends a selected %s score statement through readScore",
        async (mode, doc) => {
            const { view, csound } = setup(doc, mode, "i 1");
            editorEvalCode(csound, "playing", mode, view, true);
            expect(csound.readScore).toHaveBeenCalledWith("i 1 0 1\n");
            expect(csound.evalCode).not.toHaveBeenCalled();
            await vi.advanceTimersByTimeAsync(201);
        }
    );

    it("keeps explicit selection and line evaluation under host control", async () => {
        const doc = "instr 1\nout 0\nendin\n";
        const { view, csound } = setup(doc, "orc", "out");
        view.dispatch({ selection: { anchor: 8, head: 13 } });
        editorEvalCode(csound, "playing", "orc", view, false);
        expect(csound.evalCode).toHaveBeenLastCalledWith("out 0");
        view.dispatch({ selection: { anchor: 8 } });
        editorEvalCode(csound, "playing", "orc", view, false);
        expect(csound.evalCode).toHaveBeenLastCalledWith("out 0");
        await vi.advanceTimersByTimeAsync(201);
    });

    it("does not evaluate while Csound is stopped", () => {
        const { view, csound } = setup("out 0\n", "orc", "out");
        editorEvalCode(csound, "stopped", "orc", view, true);
        expect(csound.evalCode).not.toHaveBeenCalled();
        expect(csound.readScore).not.toHaveBeenCalled();
    });
});
