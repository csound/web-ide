import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
    act,
    cleanup,
    fireEvent,
    render,
    screen
} from "@testing-library/react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import theme from "../../styles/_theme-github-light";
import LpcTool from "./lpc-tool";
import { exampleText, parseLpcText } from "./format";
import { updateLpc } from "./client";
import type { AudioSource } from "../audio-tools/audio-tool";
vi.mock("./client", () => ({ updateLpc: vi.fn(), openLpcFile: vi.fn() }));
vi.mock("../score-tools/code-pane", () => ({
    CodePane: ({
        value,
        onChange,
        label
    }: {
        value: string;
        onChange?: (value: string) => void;
        label: string;
    }) => (
        <textarea
            aria-label={label}
            value={value}
            readOnly={!onChange}
            onChange={(event) => onChange?.(event.target.value)}
        />
    )
}));
vi.mock("../audio-tools/visuals", () => ({
    AnalysisGraph: () => <div>Curve</div>
}));
beforeEach(() => {
    vi.useFakeTimers();
});
afterEach(() => {
    cleanup();
    vi.resetAllMocks();
    vi.useRealTimers();
});
function mount(sources: AudioSource[] = []) {
    const save = vi.fn(() => "analysis.lpc");
    const view = render(
        <ThemeProvider
            theme={createTheme({
                ...theme,
                font: { regular: "sans-serif", monospace: "monospace" }
            })}
        >
            <LpcTool sources={sources} onSave={save} />
        </ThemeProvider>
    );
    return { ...view, save };
}
function edit(text: string) {
    fireEvent.change(screen.getByLabelText("LPC text"), {
        target: { value: text }
    });
}
const button = (name: string) =>
    screen.getByRole("button", { name, exact: true }) as HTMLButtonElement;
const result = (text: string) => ({
    name: "analysis.lpc",
    data: new Uint8Array([1, 0]),
    text,
    analysis: parseLpcText(text)
});
it("debounces text, blocks old output, and never saves a cancelled result", async () => {
    const { save } = mount();
    let resolve!: (value: ReturnType<typeof result>) => void;
    vi.mocked(updateLpc).mockImplementation(
        () =>
            new Promise((done) => {
                resolve = done;
            })
    );
    fireEvent.click(button("Try example"));
    await act(() => vi.advanceTimersByTimeAsync(399));
    expect(updateLpc).not.toHaveBeenCalled();
    edit(exampleText + "\n");
    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(updateLpc).toHaveBeenCalledOnce();
    const signal = vi.mocked(updateLpc).mock.calls[0][1];
    expect(button("Download .lpc").disabled).toBe(true);
    fireEvent.click(button("Reset edits"));
    expect(signal.aborted).toBe(true);
    await act(async () => resolve(result(exampleText + "\n")));
    expect(button("Add .lpc to project").disabled).toBe(true);
    vi.mocked(updateLpc).mockResolvedValue(result(exampleText));
    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(button("Download .lpc").disabled).toBe(false);
    fireEvent.click(button("Add .lpc to project"));
    expect(save).toHaveBeenCalledOnce();
    expect(button("Add .lpc to project").disabled).toBe(true);
    edit("invalid");
    expect(button("Download .lpc").disabled).toBe(true);
    expect(screen.queryByText(/Preview matches/)).toBeNull();
});
it("cancels a slow file load and ignores its late contents", async () => {
    let resolve!: (value: Uint8Array) => void;
    let signal: AbortSignal | undefined;
    mount([
        {
            id: "slow",
            name: "slow.lpc",
            load: (current) => {
                signal = current;
                return new Promise((done) => {
                    resolve = done;
                });
            }
        }
    ]);
    fireEvent.change(screen.getByLabelText("Project analysis file"), {
        target: { value: "slow" }
    });
    expect(screen.getByLabelText("LPC editor").getAttribute("aria-busy")).toBe(
        "true"
    );
    fireEvent.click(button("Cancel"));
    expect(signal?.aborted).toBe(true);
    await act(async () => resolve(new TextEncoder().encode(exampleText)));
    expect(
        (screen.getByLabelText("LPC text") as HTMLTextAreaElement).value
    ).toBe("");
    expect(updateLpc).not.toHaveBeenCalled();
});
it("aborts conversion when closing the tool", async () => {
    const { unmount } = mount();
    vi.mocked(updateLpc).mockImplementation(() => new Promise(() => {}));
    fireEvent.click(button("Try example"));
    await act(() => vi.advanceTimersByTimeAsync(400));
    const signal = vi.mocked(updateLpc).mock.calls[0][1];
    unmount();
    expect(signal.aborted).toBe(true);
});
