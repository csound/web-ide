import { Compartment, EditorState } from "@codemirror/state";
import {
    CompletionContext,
    type CompletionSource
} from "@codemirror/autocomplete";
import { EditorView } from "@codemirror/view";
import { forceParsing, syntaxTree } from "@codemirror/language";
import { afterEach, expect, it, vi } from "vitest";
import { csoundEditorLanguage } from "./csound-language";
import { scoreSections } from "../csound/score-source";
import * as scoreSource from "../csound/score-source";
import { csdScoreSections, inExternalScore } from "./csd-score-sections";
import { csdWithScoreLanguages } from "./score-languages";

const views: EditorView[] = [];
afterEach(() => {
    views.splice(0).forEach((view) => view.destroy());
    vi.restoreAllMocks();
});
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
const tokens = (view: EditorView, name: string) => {
    // Parsing can yield under full-suite load; inspect colors only once it finishes.
    expect(forceParsing(view, view.state.doc.length, 1000)).toBe(true);
    return [...view.contentDOM.querySelectorAll(`.cm-score-${name}`)].map(
        (element) => element.textContent
    );
};

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

it.each([
    [" scot", "score { $voice 4c }", "c"],
    ["  ./scot.wasm  ", "score { $voice 4c }", "c"],
    ["  'tools/scot.wasm'  ", "score { $voice 4c }", "c"],
    [" csbeats", "i1 m1 b1 C4 q mf", "C4"],
    ["  ./csbeats.wasm  ", "i1 m1 b1 C4 q mf", "C4"]
])(
    "highlights whitespace-padded bin=%s consistently",
    (command, body, pitch) => {
        const view = create(score(command, body));
        expect(tokens(view, "pitch")).toEqual([pitch]);
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

it("shares one score scan across parsing, highlighting, completion and cursor moves", async () => {
    const scan = vi.spyOn(scoreSource, "scoreSections");
    const source = `<CsInstruments>\na1 = oscili(0.2, 440)\n</CsInstruments>\n${score("scot", "score { $voice 4c }")}`;
    const view = create(source);
    const cached = view.state.field(csdScoreSections);
    expect(scan).toHaveBeenCalledTimes(1);
    for (const position of [
        source.indexOf("oscili") + 6,
        source.indexOf("440"),
        source.indexOf("$voice")
    ]) {
        view.dispatch({ selection: { anchor: position } });
        for (const complete of view.state.languageDataAt<CompletionSource>(
            "autocomplete",
            position
        ))
            await complete(new CompletionContext(view.state, position, true));
        expect(view.state.field(csdScoreSections)).toBe(cached);
    }
    expect(scan).toHaveBeenCalledTimes(1);
    view.dispatch({ changes: { from: 0, insert: "; changed\n" } });
    expect(scan).toHaveBeenCalledTimes(2);
    expect(view.state.field(csdScoreSections)).not.toBe(cached);
    expect(view.state.field(csdScoreSections).external[0].from).toBe(
        cached.external[0].from + "; changed\n".length
    );
    expect(tokens(view, "pitch")).toEqual(["c"]);
});

it("removes score exclusions when switching away from CSD mode without editing", () => {
    const mode = new Compartment();
    const doc =
        'Sexample = {{\n<CsScore bin="scot">\n}}\na1 = oscili(0.2, 440)';
    const state = EditorState.create({
        doc,
        extensions: mode.of(csoundEditorLanguage("csd"))
    });
    expect(inExternalScore(state, doc.length)).toBe(true);
    const standalone = state.update({
        effects: mode.reconfigure(csoundEditorLanguage("orc"))
    }).state;
    expect(standalone.doc).toBe(state.doc);
    expect(standalone.field(csdScoreSections, false)).toBeUndefined();
    expect(inExternalScore(standalone, doc.length)).toBe(false);
});

it("supports direct parsing without an editor state cache", () => {
    const source = score(" scot", "score { $voice 4c }");
    const tree = csdWithScoreLanguages.parser.parse(source);
    expect(tree.topNode.resolveInner(source.indexOf("$voice") + 1).name).toBe(
        "scoreInstrument"
    );
});
