import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { afterEach, expect, it } from "vitest";
import { csoundEditorLanguage } from "./csound-language";
import { scoreSections } from "../csound/score-source";

const views: EditorView[] = [];
afterEach(() => views.splice(0).forEach((view) => view.destroy()));
const score = (command: string, body: string) =>
    `<CsScore bin="${command}">\n${body}\n</CsScore>`;
const create = (doc: string) => {
    const view = new EditorView({
        parent: document.body,
        state: EditorState.create({
            doc,
            extensions: csoundEditorLanguage("csd")
        })
    });
    views.push(view);
    return view;
};
const tokens = (view: EditorView, name: string) =>
    [...view.contentDOM.querySelectorAll(`.cm-score-${name}`)].map(
        (element) => element.textContent
    );

it.each(["scot", "scot.wasm", "./scot", "tools/scot.wasm"])(
    "mounts SCOT highlighting for %s without changing orchestra colors",
    (command) => {
        const view = create(
            `<CsoundSynthesizer>\n<CsInstruments>\ninstr 1\na1 = oscili(0.1, 440)\nendin\n</CsInstruments>\n${score(command, "orchestra { voice=1 }\nscore { $voice 4c d e f }\n; notes")}\n</CsoundSynthesizer>`
        );
        expect(tokens(view, "pitch")).toEqual(["c", "d", "e", "f"]);
        expect(tokens(view, "instrument")).toEqual(["$voice"]);
        expect(tokens(view, "comment")).toEqual(["; notes"]);
        expect(
            view.contentDOM.querySelector(
                ".cm-csound-a-rate-var:not(.cm-score-pitch)"
            )?.textContent
        ).toBe("a1");
        const pos = view.state.doc.toString().indexOf("$voice");
        expect(syntaxTree(view.state).topNode.resolveInner(pos + 1).name).toBe(
            "scoreInstrument"
        );
        expect(view.state.languageDataAt("autocomplete", pos)).toEqual([]);
    }
);

it("handles several notations and re-parses when bin changes", () => {
    const doc = `${score("csbeats", "i1 m1 b1 C4 q mf")}\n${score("scot", "score { $voice 4c }")}`;
    const view = create(doc);
    expect(tokens(view, "pitch")).toEqual(["C4", "c"]);
    expect(tokens(view, "duration")).toEqual(["q", "4"]);
    const from = doc.indexOf("csbeats");
    view.dispatch({ changes: { from, to: from + 7, insert: "unknown" } });
    expect(tokens(view, "pitch")).toEqual(["c"]);
    view.dispatch({
        changes: { from, to: from + 7, insert: "./csbeats.wasm" }
    });
    expect(tokens(view, "pitch")).toEqual(["C4", "c"]);
});

it("does not treat comments, raw orchestra strings or embedded files as score blocks", () => {
    const fake = score("scot", "score { $voice 4c }");
    const doc = `<!--\n${fake}\n-->\n<CsInstruments>\nStext = {{\n${fake}\n}}\n</CsInstruments>\n<CsFile filename="example">\n${fake}\n</CsFile>\n${score("csbeats", "i1 C4 q")}`;
    expect(scoreSections(doc)).toHaveLength(1);
    const view = create(doc);
    expect(tokens(view, "pitch")).toEqual(["C4"]);
});

it("keeps highlighting an incomplete score while typing", () => {
    const view = create('<CsScore bin="scot">\nscore { $voice 4c');
    expect(tokens(view, "pitch")).toEqual(["c"]);
});
