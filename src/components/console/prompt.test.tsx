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
    render(
        <ThemeProvider
            theme={createTheme({
                ...theme,
                font: { monospace: "monospace", regular: "sans-serif" }
            })}
        >
            <ConsoleContext.Provider value={["Csound output\n"]}>
                <Console />
            </ConsoleContext.Provider>
        </ThemeProvider>
    );
    expect(screen.queryByRole("textbox")).toBeNull();
    act(() => listener({ requestId: 1, prompt }));
    return {
        engine,
        listener,
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

it("inserts a newline at the selection on Ctrl+Enter and queues lines on Enter", async () => {
    const { engine, input, listener } = setup("");
    fireEvent.change(input, { target: { value: "first replace second" } });
    input.setSelectionRange(5, 14);
    fireEvent.keyDown(input, { key: "Enter", ctrlKey: true });
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
