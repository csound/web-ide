import {
    CompletionContext,
    type CompletionSource
} from "@codemirror/autocomplete";
import { bundledOpcodes } from "../../plugins/catalog";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { afterEach, expect, it, vi } from "vitest";
import { findManualEntry } from "../../manual/lookup";
import { csoundEditorLanguage } from "./csound-language";
import { setUdoDeclarations } from "./validation/udos";

vi.mock("../../manual/lookup", () => ({ findManualEntry: vi.fn() }));
const views: EditorView[] = [];
afterEach(() => {
    views.splice(0).forEach((view) => view.destroy());
    vi.resetAllMocks();
});

function editor(
    doc = "a1 = oscili:a(0.2, 440)\n",
    anchor = doc.lastIndexOf("0.2")
) {
    const openManual = vi.fn();
    const view = new EditorView({
        state: EditorState.create({
            doc,
            selection: { anchor },
            extensions: csoundEditorLanguage("orc", openManual)
        }),
        parent: document.body
    });
    views.push(view);
    return { view, openManual };
}

it("links a typed opcode to its manual article and opens it in the dock", async () => {
    vi.mocked(findManualEntry).mockResolvedValue("/manual/opcodes/oscili/");
    const { view, openManual } = editor();
    await vi.waitFor(() => expect(view.dom.querySelector("a")).not.toBeNull());
    const link = view.dom.querySelector("a")!;
    expect(link.textContent).toBe("Open in manual");
    expect(link.getAttribute("href")).toBe("/manual/opcodes/oscili/");
    expect(findManualEntry).toHaveBeenCalledWith("oscili");
    link.click();
    expect(openManual).toHaveBeenCalledExactlyOnceWith("oscili");

    const modified = new MouseEvent("click", {
        ctrlKey: true,
        cancelable: true
    });
    let handled;
    link.addEventListener(
        "click",
        (event) => {
            handled = event.defaultPrevented;
            // Avoid jsdom navigation after checking the dock left this click alone.
            event.preventDefault();
        },
        { once: true }
    );
    link.dispatchEvent(modified);
    expect(handled).toBe(false);
    expect(openManual).toHaveBeenCalledTimes(1);
});

it("keeps the synopsis without a link when no manual entry is found", async () => {
    vi.mocked(findManualEntry).mockResolvedValue(undefined);
    const { view } = editor();
    await vi.waitFor(() => expect(findManualEntry).toHaveBeenCalled());
    expect(
        view.dom.querySelector(".cm-csound-synopsis .cm-csound-opcode")
            ?.textContent
    ).toBe("oscili");
    expect(view.dom.querySelector("a")).toBeNull();
});

it("does not link user-defined opcodes to built-in documentation", async () => {
    const { view } = editor(
        "opcode localPass(signal:a):a\n xout(signal)\nendop\na1 = localPass(0.2)\n"
    );
    await vi.waitFor(() =>
        expect(view.dom.querySelector(".cm-csound-opcode")?.textContent).toBe(
            "localPass"
        )
    );
    expect(findManualEntry).not.toHaveBeenCalled();
    expect(view.dom.querySelector("a")).toBeNull();
});

it.each([false, true])(
    "ignores a late manual lookup after cursor movement or destruction (%s)",
    async (destroy) => {
        let resolve!: (href: string) => void;
        vi.mocked(findManualEntry).mockReturnValue(
            new Promise((done) => {
                resolve = done;
            })
        );
        const { view, openManual } = editor();
        await vi.waitFor(() => expect(findManualEntry).toHaveBeenCalled());
        const panel = view.dom.querySelector(".cm-csound-synopsis")!;
        if (destroy) view.destroy();
        else view.dispatch({ selection: { anchor: view.state.doc.length } });
        resolve("/manual/opcodes/oscili/");
        await Promise.resolve();
        expect(panel.querySelector("a")).toBeNull();
        expect(openManual).not.toHaveBeenCalled();
    }
);

it.each([
    ["a1 STKMandolin 220, 0.2\n", "STKMandolin", "STK"],
    ["a1 STKMandolin 220, sin(0.1) + 0.2\n", "STKMandolin", "STK"],
    ["a1, a2, a3 chuap 0.2, 0, 1e-7\n", "chuap", "Chua"],
    ["ih = imagecreate(2, 0.2)\n", "imagecreate", "Image"],
    ["iv la_i_vr_create 0.2\n", "la_i_vr_create", "Linear algebra"]
])(
    "shows bundled plugin help and a local manual link for %s",
    async (doc, name, group) => {
        vi.mocked(findManualEntry).mockResolvedValue(
            `/manual/opcodes/${name}/`
        );
        const { view, openManual } = editor(doc);
        await vi.waitFor(() =>
            expect(
                view.dom.querySelector(".cm-csound-plugin-label")?.textContent
            ).toBe(`Plugin · ${group}`)
        );
        expect(view.dom.querySelector(".cm-csound-opcode")?.textContent).toBe(
            name
        );
        await vi.waitFor(() =>
            expect(
                view.dom.querySelector(".cm-csound-manual-link")
            ).not.toBeNull()
        );
        view.dom
            .querySelector<HTMLAnchorElement>(".cm-csound-manual-link")!
            .click();
        expect(openManual).toHaveBeenCalledWith(name);
    }
);

it("offers every bundled opcode with its plugin label before a background check", async () => {
    const { view } = editor("STK", 3);
    const sources = view.state.languageDataAt<CompletionSource>(
        "autocomplete",
        3
    );
    const result = await sources[0](new CompletionContext(view.state, 3, true));
    for (const name of bundledOpcodes.keys()) {
        const options = result!.options.filter(
            (option) => option.label === name
        );
        expect(options).toHaveLength(1);
        expect(options[0].detail).toContain("Plugin ·");
    }
});

it("keeps a local UDO named like a bundled opcode separate from its manual", async () => {
    const { view } = editor(
        "opcode STKMandolin(signal:a):a\n xout(signal)\nendop\na1 = STKMandolin(0.2)\n"
    );
    await vi.waitFor(() =>
        expect(view.dom.querySelector(".cm-csound-opcode")?.textContent).toBe(
            "STKMandolin"
        )
    );
    expect(view.dom.querySelector(".cm-csound-plugin-label")).toBeNull();
    expect(findManualEntry).not.toHaveBeenCalled();
});

it.each([false, true])(
    "keeps plugin and nested UDO help on the same line (catalog: %s)",
    async (checked) => {
        const doc =
            "opcode localGain(value:i):i\n xout value\nendop\ninstr 1\na1 STKMandolin 220, localGain(0.2)\nendin";
        vi.mocked(findManualEntry).mockResolvedValue(
            "/manual/opcodes/STKMandolin/"
        );
        const { view } = editor(doc, doc.indexOf("220"));
        if (checked) view.dispatch({ effects: setUdoDeclarations.of([]) });
        const name = () =>
            view.dom.querySelector(".cm-csound-synopsis .cm-csound-opcode")
                ?.textContent;
        await vi.waitFor(() => expect(name()).toBe("STKMandolin"));
        expect(
            view.dom.querySelector(".cm-csound-plugin-label")?.textContent
        ).toBe("Plugin · STK");
        const highlighted = [
            ...view.contentDOM.querySelectorAll(".cm-csound-opcode")
        ].map((node) => node.textContent);
        expect(highlighted).toContain("STKMandolin");
        expect(
            highlighted.filter((name) => name === "localGain").length
        ).toBeGreaterThanOrEqual(2);
        view.dispatch({ selection: { anchor: doc.indexOf("0.2") } });
        await vi.waitFor(() => expect(name()).toBe("localGain"));
        expect(view.dom.querySelector(".cm-csound-plugin-label")).toBeNull();
        expect(view.dom.querySelector(".cm-csound-manual-link")).toBeNull();
        view.dispatch({
            selection: { anchor: doc.indexOf("0.2") + "0.2)".length }
        });
        await vi.waitFor(() => expect(name()).toBe("STKMandolin"));
    }
);
