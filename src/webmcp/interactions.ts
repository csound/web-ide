import { EditorView } from "@codemirror/view";
import { isolateHistory } from "@codemirror/commands";
import { MAX_TYPING_DURATION_MS, ToolError } from "./tools";

const typing = new WeakSet<EditorView>();

export function waitForEditorStep(
    ms: number,
    signal: AbortSignal
): Promise<void> {
    signal.throwIfAborted();
    return new Promise((resolve, reject) => {
        const abort = () => {
            clearTimeout(timer);
            reject(
                new DOMException(
                    "The call was cancelled. Partial typing remains unsaved.",
                    "AbortError"
                )
            );
        };
        const timer = setTimeout(() => {
            signal.removeEventListener("abort", abort);
            resolve();
        }, ms);
        signal.addEventListener("abort", abort, { once: true });
    });
}

export function checkPosition(source: string, position: number): void {
    if (
        position > source.length ||
        (position > 0 &&
            /[\uD800-\uDBFF]/.test(source[position - 1]) &&
            /[\uDC00-\uDFFF]/.test(source[position] ?? ""))
    ) {
        throw new ToolError(
            "invalid_position",
            "Use an offset within the current source, outside a surrogate pair."
        );
    }
}

export async function typeIntoEditor(
    view: EditorView,
    {
        from,
        to,
        text,
        delay,
        signal,
        check,
        onChange
    }: {
        from: number;
        to: number;
        text: string;
        delay: number;
        signal: AbortSignal;
        check: () => void;
        onChange: (source: string) => Promise<void>;
    }
): Promise<void> {
    if (typing.has(view))
        throw new ToolError(
            "busy",
            "This editor is already typing. Wait for that call or cancel it."
        );
    typing.add(view);
    let expectedDoc = view.state.doc;
    let expectedSelection = view.state.selection;
    let position = from;
    const characters = Array.from(text.replace(/\r\n?/g, "\n"));
    const started = performance.now();
    try {
        for (const [index, character] of characters.entries()) {
            if (index > 0) await waitForEditorStep(delay, signal);
            signal.throwIfAborted();
            if (performance.now() - started >= MAX_TYPING_DURATION_MS)
                throw new ToolError(
                    "typing_timeout",
                    "Typing reached the time limit. Partial text stays unsaved; read again."
                );
            check();
            if (
                !view.dom.isConnected ||
                view.state.doc !== expectedDoc ||
                !view.state.selection.eq(expectedSelection)
            ) {
                throw new ToolError(
                    "editor_changed",
                    "Typing stopped because the source or cursor changed. Partial text stays unsaved; read again."
                );
            }
            view.dispatch({
                changes: {
                    from: position,
                    to: index === 0 ? to : position,
                    insert: character
                },
                selection: { anchor: position + character.length },
                scrollIntoView: true,
                annotations:
                    index === 0 ? isolateHistory.of("before") : undefined,
                userEvent: "input.type.webmcp"
            });
            position += character.length;
            expectedDoc = view.state.doc;
            expectedSelection = view.state.selection;
            await onChange(expectedDoc.toString());
        }
    } finally {
        typing.delete(view);
        if (view.dom.isConnected)
            view.dispatch({ annotations: isolateHistory.of("after") });
    }
}
