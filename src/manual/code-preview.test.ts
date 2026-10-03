import { afterEach, expect, it } from "vitest";
import { deleteCharForward, selectAll } from "@codemirror/commands";
import { language } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import {
    csoundCsdLanguage,
    csoundOrcLanguage,
    csoundScoLanguage
} from "@kunstmusik/codemirror-lang-csound";
import { createCodePreview } from "./code-preview";

const views: EditorView[] = [];
afterEach(() => views.splice(0).forEach((view) => view.destroy()));

it("lets readers select all code while edit commands leave it intact", () => {
    const source = "instr 1\n  aSignal = oscili(0.5, 440)\nendin\n";
    const view = createCodePreview(
        document.body,
        source,
        "csound-orc",
        "oscili"
    );
    views.push(view);
    expect(selectAll(view)).toBe(true);
    expect(view.state.selection.main.from).toBe(0);
    expect(view.state.selection.main.to).toBe(source.length);
    expect(deleteCharForward(view)).toBe(false);
    expect(view.state.doc.toString()).toBe(source);
    expect(view.contentDOM.getAttribute("contenteditable")).toBe("false");
    expect(view.contentDOM.tabIndex).toBe(0);
    expect(view.contentDOM.getAttribute("role")).toBe("textbox");
    expect(view.contentDOM.getAttribute("aria-readonly")).toBe("true");
    expect(view.contentDOM.getAttribute("aria-label")).toBe(
        "oscili, read only"
    );
    expect(
        view.contentDOM.querySelector(".cm-csound-opcode")?.textContent
    ).toBe("oscili");
    expect(
        view.contentDOM.querySelector(".cm-csound-a-rate-var")?.textContent
    ).toBe("aSignal");
});

for (const [name, source, expected] of [
    ["csound-orc", "a1 oscili 0.5, 440", csoundOrcLanguage],
    ["csound-sco", "i 1 0 1", csoundScoLanguage],
    [
        "csound-csd",
        "<CsoundSynthesizer>\n<CsScore>\ni 1 0 1\n</CsScore>\n</CsoundSynthesizer>",
        csoundCsdLanguage
    ],
    // The upstream manual labels some full CSDs as orchestra code.
    [
        "csound-orc",
        "<CsoundSynthesizer>\n<CsInstruments>\ninstr 1\nendin\n</CsInstruments>\n</CsoundSynthesizer>",
        csoundCsdLanguage
    ]
] as const) {
    it(`uses the Csound parser for ${name}: ${source.slice(0, 20)}`, () => {
        const view = createCodePreview(document.body, source, name, "Example");
        views.push(view);
        expect(view.state.facet(language)).toBe(expected);
        expect(
            view.contentDOM.querySelector('[class*="cm-csound-"]')
        ).not.toBeNull();
    });
}
