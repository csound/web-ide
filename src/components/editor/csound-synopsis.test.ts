import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { afterEach, expect, it, vi } from "vitest";
import { findManualEntry } from "../../manual/lookup";
import { csoundEditorLanguage } from "./csound-language";

vi.mock("../../manual/lookup", () => ({ findManualEntry: vi.fn() }));
const views: EditorView[] = [];
afterEach(() => {
    views.splice(0).forEach((view) => view.destroy());
    vi.resetAllMocks();
});

function editor(doc = "a1 = oscili:a(0.2, 440)\n") {
    const openManual = vi.fn();
    const view = new EditorView({
        state: EditorState.create({
            doc,
            selection: { anchor: doc.lastIndexOf("0.2") },
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
