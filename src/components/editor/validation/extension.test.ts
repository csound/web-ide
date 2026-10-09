import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import {
    diagnosticCount,
    forEachDiagnostic,
    setDiagnostics
} from "@codemirror/lint";
import { backgroundValidation, CHECK_DELAY } from "./extension";
import type { CheckResult } from "./types";
import {
    udoCatalog,
    setUdoDeclarations,
    setPartialUdoDeclarations
} from "./udos";

let view: EditorView | undefined;
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
    view?.destroy();
    vi.useRealTimers();
});
function editor(execute: ReturnType<typeof vi.fn>) {
    return new EditorView({
        parent: document.body,
        state: EditorState.create({
            doc: "instr 1\nendin",
            extensions: [
                udoCatalog,
                backgroundValidation(
                    (text) => ({
                        filename: "main.orc",
                        files: [{ name: "main.orc", text }]
                    }),
                    execute,
                    true
                )
            ]
        })
    });
}
it("waits for a quiet pause and rejects a response for older text", async () => {
    let resolve!: (value: CheckResult) => void;
    const execute = vi.fn(
        () =>
            new Promise<CheckResult>((done) => {
                resolve = done;
            })
    );
    view = editor(execute);
    await vi.advanceTimersByTimeAsync(CHECK_DELAY - 1);
    expect(execute).not.toHaveBeenCalled();
    view.dispatch({ changes: { from: 0, insert: "; edited\n" } });
    await vi.advanceTimersByTimeAsync(CHECK_DELAY);
    expect(execute).toHaveBeenCalledTimes(1);
    view.dispatch({ changes: { from: 0, insert: "; newer\n" } });
    resolve({
        available: true,
        diagnostics: [{ filename: "main.orc", line: 2, message: "old error" }],
        udos: [
            {
                name: "Stale",
                filename: "main.orc",
                line: 1,
                inputs: [],
                outputs: []
            }
        ]
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(diagnosticCount(view.state)).toBe(0);
    expect(view.state.field(udoCatalog)).toBeUndefined();
});
it("shows only diagnostics for the checked file and stops on destruction", async () => {
    const execute = vi.fn(async () => ({
        available: true,
        diagnostics: [
            { filename: "main.orc", line: 1, message: "Syntax error" },
            { filename: "other.udo", line: 1, message: "Included error" }
        ]
    }));
    view = editor(execute);
    await vi.advanceTimersByTimeAsync(CHECK_DELAY);
    expect(diagnosticCount(view.state)).toBe(1);
    expect(view.dom.querySelector(".cm-lint-marker-error")).not.toBeNull();
    view.dispatch({ changes: { from: 0, insert: "; typing" } });
    view.destroy();
    view = undefined;
    await vi.advanceTimersByTimeAsync(CHECK_DELAY);
    expect(execute).toHaveBeenCalledTimes(1);
});
it("does nothing when the optional artifact is absent", async () => {
    const execute = vi.fn();
    expect(backgroundValidation(() => undefined, execute, false)).toEqual([]);
    await vi.advanceTimersByTimeAsync(CHECK_DELAY);
    expect(execute).not.toHaveBeenCalled();
});

it("sends only confirmed UDO names and drops them after a successful replacement", async () => {
    const execute = vi.fn(async () => ({ available: false, diagnostics: [] }));
    view = editor(execute);
    const udo = {
        name: "Kept",
        filename: "main.orc",
        line: 1,
        inputs: [],
        outputs: []
    };
    view.dispatch({ effects: setUdoDeclarations.of([udo]) });
    view.dispatch({
        effects: setPartialUdoDeclarations.of([{ ...udo, name: "Draft" }])
    });
    await vi.advanceTimersByTimeAsync(CHECK_DELAY);
    expect(execute).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ knownOpcodes: ["Kept"] }),
        expect.any(AbortSignal)
    );
    view.dispatch({
        effects: setUdoDeclarations.of([]),
        changes: { from: 0, insert: "; edit\n" }
    });
    await vi.advanceTimersByTimeAsync(CHECK_DELAY);
    expect(execute).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ knownOpcodes: [] }),
        expect.any(AbortSignal)
    );
});

it("removes touched compiler markers and moves untouched markers with the text", async () => {
    view = editor(vi.fn(async () => ({ available: false, diagnostics: [] })));
    view.dispatch(
        setDiagnostics(view.state, [
            { from: 0, to: 7, message: "Compiler error", severity: "error" },
            { from: 8, to: 13, message: "Another error", severity: "error" }
        ])
    );
    view.dispatch({ changes: { from: 1, insert: "x" } });
    const ranges: number[][] = [];
    forEachDiagnostic(view.state, (_, from, to) => ranges.push([from, to]));
    expect(ranges).toEqual([[9, 14]]);
    await vi.advanceTimersByTimeAsync(CHECK_DELAY);
    expect(diagnosticCount(view.state)).toBe(1);
});
