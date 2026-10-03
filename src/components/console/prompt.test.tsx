import { afterEach, expect, it, vi } from "vitest";
import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor
} from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import theme from "../../styles/_theme-dracula";
import { ConsoleContext } from "./context";
import Console from "./console";
import { consoleReadline, type ReadlineEvent } from "./readline";

let disconnect = () => {};
afterEach(() => {
    cleanup();
    disconnect();
});

function setup(prompt = "input> ") {
    let listener!: (event: ReadlineEvent) => void;
    const engine = {
        on: (_name: string, cb: typeof listener) => {
            listener = cb;
        },
        off: vi.fn(),
        readlineSubmit: vi.fn(async () => 0)
    };
    disconnect = consoleReadline.connect(engine, "fixture", vi.fn());
    const consoleForProject = (projectUid: string) => (
        <ThemeProvider
            theme={createTheme({
                ...theme,
                font: { monospace: "monospace", regular: "sans-serif" }
            })}
        >
            <ConsoleContext.Provider value={["Csound output\n"]}>
                <Console projectUid={projectUid} />
            </ConsoleContext.Provider>
        </ThemeProvider>
    );
    const { rerender } = render(consoleForProject("fixture"));
    expect(screen.queryByRole("textbox")).toBeNull();
    act(() => listener({ requestId: 1, prompt }));
    return {
        engine,
        listener,
        navigate: (projectUid: string) =>
            rerender(consoleForProject(projectUid)),
        input: screen.getByRole("textbox") as HTMLTextAreaElement
    };
}

it("opens below the logs, focuses the input and submits on Enter", async () => {
    const { engine, input } = setup();
    expect(document.activeElement).toBe(input);
    expect(screen.getByTestId("console-output").textContent).toBe(
        "Csound output\n"
    );
    fireEvent.change(input, { target: { value: "héllo" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() =>
        expect(engine.readlineSubmit).toHaveBeenCalledWith(1, "héllo")
    );
});

it("inserts a newline at the selection on Shift+Enter and queues lines on Enter", async () => {
    const { engine, input, listener } = setup("");
    fireEvent.change(input, { target: { value: "first replace second" } });
    input.setSelectionRange(5, 14);
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(input.value).toBe("first\nsecond");
    expect(input.selectionStart).toBe(6);
    expect(engine.readlineSubmit).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() =>
        expect(engine.readlineSubmit).toHaveBeenCalledWith(1, "first")
    );
    expect(screen.getByRole("status").textContent).toBe("1 line queued");
    act(() => listener({ requestId: 2, prompt: "next> " }));
    await waitFor(() =>
        expect(engine.readlineSubmit).toHaveBeenCalledWith(2, "second")
    );
});

it("does not submit Enter used to compose text with an IME", () => {
    const { engine, input } = setup();
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    expect(engine.readlineSubmit).not.toHaveBeenCalled();
});

it("offers a button to submit an empty response and clears on stop", async () => {
    const { engine } = setup("");
    fireEvent.click(screen.getByRole("button", { name: "Send input" }));
    await waitFor(() =>
        expect(engine.readlineSubmit).toHaveBeenCalledWith(1, "")
    );
    act(() => disconnect());
    expect(screen.queryByRole("textbox")).toBeNull();
});

it("hides another project's pending prompt and restores its draft on return", async () => {
    const { engine, input, navigate } = setup();
    fireEvent.change(input, { target: { value: "unsent answer" } });

    navigate("other-project");
    expect(screen.queryByRole("form", { name: "Csound input" })).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
    fireEvent.keyDown(document.body, { key: "Enter" });
    expect(engine.readlineSubmit).not.toHaveBeenCalled();

    navigate("fixture");
    const restored = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(restored.value).toBe("unsent answer");
    expect(document.activeElement).toBe(restored);
    fireEvent.keyDown(restored, { key: "Enter" });
    await waitFor(() =>
        expect(engine.readlineSubmit).toHaveBeenCalledExactlyOnceWith(
            1,
            "unsent answer"
        )
    );
});

it.each(["queued", "error"])(
    "keeps %s input scoped to its project after the request closes",
    async (state) => {
        const { engine, input, listener, navigate } = setup();
        let finish!: (result: number) => void;
        engine.readlineSubmit.mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    finish = resolve;
                })
        );
        fireEvent.change(input, { target: { value: "first\nsecond" } });
        fireEvent.keyDown(input, { key: "Enter" });
        act(() => listener({ requestId: 1, prompt: null }));
        navigate("other-project");
        expect(screen.queryByRole("form", { name: "Csound input" })).toBeNull();

        await act(async () => finish(state === "error" ? -1 : 0));
        expect(consoleReadline.getSnapshot().request).toBeNull();
        expect(screen.queryByRole("form", { name: "Csound input" })).toBeNull();
        navigate("fixture");
        if (state === "queued") {
            expect(screen.getByRole("status").textContent).toBe(
                "1 line queued"
            );
            fireEvent.click(
                screen.getByRole("button", { name: "Clear queue" })
            );
            act(() => listener({ requestId: 2, prompt: "Next> " }));
            expect(engine.readlineSubmit).toHaveBeenCalledTimes(1);
        } else {
            expect(screen.getByRole("alert").textContent).toContain(
                "Csound did not accept this line"
            );
            expect(
                (screen.getByRole("textbox") as HTMLTextAreaElement).value
            ).toBe("first\nsecond");
        }
    }
);
