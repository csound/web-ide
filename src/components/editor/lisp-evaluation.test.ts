import { afterEach, describe, expect, it, vi } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { clojureEditorLanguage } from "./clojure-language";
import { editorEvalCode, editorEvalFile, evalBlinkExtension } from "./utils";
import type { CsoundObj } from "../csound/types";

const views: EditorView[] = [];
afterEach(() => {
    views.splice(0).forEach((view) => view.destroy());
    vi.useRealTimers();
});

function setup() {
    vi.useFakeTimers();
    const inner = "(+ x 1)";
    const form = `(defn next [x]\n  ${inner})`;
    const doc = `${form}\n(next 41)`;
    const view = new EditorView({
        state: EditorState.create({
            doc,
            selection: { anchor: doc.indexOf("+ x") },
            extensions: [clojureEditorLanguage(), evalBlinkExtension]
        }),
        parent: document.body
    });
    views.push(view);
    const csound = {
        evalCode: vi.fn().mockResolvedValue(1),
        setStringChannel: vi.fn().mockResolvedValue(undefined)
    };
    return { view, csound, form, inner, doc };
}

describe("Lisp editor evaluation", () => {
    it.each([false, true])(
        "evaluates and blinks only the chosen form (block: %s)",
        async (block) => {
            const { view, csound, inner, form } = setup();
            await editorEvalCode(csound, "playing", "lisp", view, block);
            expect(csound.setStringChannel).toHaveBeenCalledWith(
                "__web_ide_lisp_source",
                block ? form : inner
            );
            expect(view.dom.querySelector(".blink-eval")?.textContent).toBe(
                block ? form.split("\n")[0] : inner
            );
            const marks = view.state.field(evalBlinkExtension);
            const range = marks.iter();
            expect(view.state.sliceDoc(range.from, range.to)).toBe(
                block ? form : inner
            );
            await vi.advanceTimersByTimeAsync(201);
            expect(view.state.field(evalBlinkExtension).size).toBe(0);
        }
    );
    it("uses the selection exactly, including more than one form", async () => {
        const { view, csound, doc } = setup();
        view.dispatch({ selection: { anchor: 0, head: doc.length } });
        await editorEvalCode(csound, "playing", "lisp", view, false);
        expect(csound.setStringChannel).toHaveBeenCalledWith(
            "__web_ide_lisp_source",
            doc
        );
    });
    it("evaluates the whole file and marks a rejected entry point in red", async () => {
        const { view, csound, doc } = setup();
        csound.evalCode.mockResolvedValue(0);
        expect(
            await editorEvalFile(
                csound as unknown as CsoundObj,
                "playing",
                "lisp",
                view
            )
        ).toBe(-1);
        expect(csound.setStringChannel).toHaveBeenCalledWith(
            "__web_ide_lisp_source",
            doc
        );
        expect(view.dom.querySelector(".blink-eval-error")).not.toBeNull();
    });
    it("does not send code while stopped or flash positions after an edit", async () => {
        const { view, csound } = setup();
        editorEvalCode(csound, "stopped", "lisp", view, false);
        expect(csound.setStringChannel).not.toHaveBeenCalled();
        let finish!: (result: number) => void;
        csound.evalCode.mockImplementation(
            () =>
                new Promise((resolve) => {
                    finish = resolve;
                })
        );
        const pending = editorEvalCode(csound, "playing", "lisp", view, false);
        await vi.advanceTimersByTimeAsync(0);
        view.dispatch({ changes: { from: 0, insert: "; editing\n" } });
        finish(1);
        await pending;
        expect(view.state.field(evalBlinkExtension).size).toBe(0);
    });
});
