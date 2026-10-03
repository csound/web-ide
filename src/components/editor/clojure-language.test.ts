import { afterEach, describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { clojureEditorLanguage, findClojureForm } from "./clojure-language";
import { filenameToCsoundType } from "../csound/utils";
import { textOrBinary } from "../projects/utils";

const views: EditorView[] = [];
afterEach(() => views.splice(0).forEach((view) => view.destroy()));

describe("Lisp files", () => {
    it.each([
        "voice.mal",
        "voice.clj",
        "voice.cljs",
        "voice.cljc",
        "VOICE.CLJX"
    ])("opens %s as Lisp text", (filename) => {
        expect(filenameToCsoundType(filename)).toBe("lisp");
        expect(textOrBinary(filename)).toBe("txt");
    });
    it.each(["voice.clj.wav", "voice.mal.png"])(
        "does not treat %s as code",
        (filename) => {
            expect(filenameToCsoundType(filename)).toBeUndefined();
            expect(textOrBinary(filename)).toBe("bin");
        }
    );

    const inner = "(csound/oscili 0.2 hz)";
    const outer = `(defn voice [hz]\n  ${inner})`;
    const source = `${outer}\n\n(voice 440)`;
    it.each([false, true])(
        "finds a complete form (top level: %s)",
        (topLevel) => {
            const state = EditorState.create({
                doc: source,
                extensions: clojureEditorLanguage()
            });
            expect(syntaxTree(state).topNode.name).toBe("Program");
            const range = findClojureForm(
                state,
                source.indexOf("oscili"),
                topLevel
            )!;
            expect(state.sliceDoc(range.from, range.to)).toBe(
                topLevel ? outer : inner
            );
        }
    );
    it("evaluates the preceding form at its closing delimiter", () => {
        const state = EditorState.create({
            doc: source,
            extensions: clojureEditorLanguage()
        });
        expect(findClojureForm(state, outer.length, true)).toEqual({
            from: 0,
            to: outer.length
        });
    });
    it.each(["'(1 2)", "`(a ~b)", "#(+ % 1)", "#{1 2}", "^:meta [1 2]"])(
        "keeps reader prefixes when selecting %s",
        (doc) => {
            const state = EditorState.create({
                doc,
                extensions: clojureEditorLanguage()
            });
            const form = findClojureForm(state, doc.length - 1)!;
            expect(state.sliceDoc(form.from, form.to)).toBe(doc);
        }
    );
    it.each(["; (voice 440)", "#_(voice 440)"])(
        "skips comments and discarded forms: %s",
        (doc) => {
            const state = EditorState.create({
                doc,
                extensions: clojureEditorLanguage()
            });
            expect(
                findClojureForm(state, doc.indexOf("voice"))
            ).toBeUndefined();
        }
    );
    it("colors nesting without counting brackets in strings or comments", () => {
        const view = new EditorView({
            doc: '(println "[ignored]" [1 {:x 2}]) ; (ignored)',
            extensions: clojureEditorLanguage(),
            parent: document.body
        });
        views.push(view);
        const brackets = [
            ...view.dom.querySelectorAll('[class*="cm-rainbow-"]')
        ];
        expect(brackets.map((element) => element.textContent)).toEqual([
            "(",
            "[",
            "{",
            "}",
            "]",
            ")"
        ]);
        expect(brackets.map((element) => element.className)).toEqual([
            "cm-rainbow-0",
            "cm-rainbow-1",
            "cm-rainbow-2",
            "cm-rainbow-2",
            "cm-rainbow-1",
            "cm-rainbow-0"
        ]);
        view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: "[1 2]" }
        });
        expect(view.dom.querySelectorAll(".cm-rainbow-0")).toHaveLength(2);
        expect(view.dom.querySelector(".cm-rainbow-1")).toBeNull();
    });
});
