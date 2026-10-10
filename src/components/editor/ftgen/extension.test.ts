import { afterEach, expect, it } from "vitest";
import { EditorView } from "@codemirror/view";
import { tablePlots, type PlotSnapshot } from "./extension";
const views: EditorView[] = [];
afterEach(() => views.splice(0).forEach((v) => v.destroy()));
function fixture() {
    let snapshot: PlotSnapshot | null = null;
    const view = new EditorView({
        doc: "giWave ftgen 0,0,1024,10,1\n",
        extensions: tablePlots("piece.orc", (next) => (snapshot = next)),
        parent: document.body
    });
    views.push(view);
    view.contentDOM.dispatchEvent(
        new KeyboardEvent("keydown", {
            key: "Enter",
            altKey: true,
            bubbles: true
        })
    );
    return { view, snapshot: () => snapshot };
}
it("tracks the same declaration through edits above it and parameter changes", () => {
    const f = fixture();
    expect(f.snapshot()?.selected.name).toBe("giWave");
    f.view.dispatch({ changes: { from: 0, insert: "; comment\n" } });
    expect(f.snapshot()?.selected.from).toBe(10);
    const from = f.view.state.doc.toString().indexOf("1024");
    f.view.dispatch({ changes: { from, to: from + 4, insert: "2048" } });
    expect(f.snapshot()?.selected.arguments[2]).toBe("2048");
});
it.each(["rename", "delete", "renumber"])(
    "closes when identity changes: %s",
    (action) => {
        const f = fixture();
        if (action === "rename")
            f.view.dispatch({ changes: { from: 2, to: 6, insert: "Other" } });
        else if (action === "renumber")
            f.view.dispatch({ changes: { from: 13, to: 14, insert: "2" } });
        else
            f.view.dispatch({
                changes: { from: 0, to: f.view.state.doc.length }
            });
        expect(f.snapshot()).toBeNull();
    }
);
