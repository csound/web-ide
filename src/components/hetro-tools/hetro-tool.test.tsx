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
import HetroTool from "./hetro-tool";
import { convertHetro, exampleText, parseHetroText } from "./convert";
import type { AudioSource } from "../audio-tools/audio-tool";
vi.mock("./convert", async (importOriginal) => ({
    ...(await importOriginal<typeof import("./convert")>()),
    convertHetro: vi.fn()
}));
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
    const save = vi.fn(() => "analysis.het");
    const view = render(
        <ThemeProvider
            theme={createTheme({
                ...theme,
                font: { regular: "sans-serif", monospace: "monospace" }
            })}
        >
            <HetroTool sources={sources} onSave={save} />
        </ThemeProvider>
    );
    return { ...view, save };
}
function edit(text: string) {
    fireEvent.change(screen.getByLabelText("HETRO text"), {
        target: { value: text }
    });
}
const button = (name: string) =>
    screen.getByRole("button", { name, exact: true }) as HTMLButtonElement;
const result = (text: string) => ({
    name: "analysis.het",
    data: new Uint8Array([1, 0]),
    text,
    analysis: parseHetroText(text)
});
it("debounces text, blocks old output, and never saves a cancelled result", async () => {
    const { save } = mount();
    let resolve!: (value: ReturnType<typeof result>) => void;
    vi.mocked(convertHetro).mockImplementation(
        () =>
            new Promise((done) => {
                resolve = done;
            })
    );
    fireEvent.click(button("Try example"));
    await act(() => vi.advanceTimersByTimeAsync(399));
    expect(convertHetro).not.toHaveBeenCalled();
    edit(exampleText.replace("16000", "9000"));
    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(convertHetro).toHaveBeenCalledOnce();
    const signal = vi.mocked(convertHetro).mock.calls[0][1];
    expect(button("Download .het").disabled).toBe(true);
    fireEvent.click(button("Reset edits"));
    expect(signal.aborted).toBe(true);
    await act(async () =>
        resolve(result(exampleText.replace("16000", "9000")))
    );
    expect(button("Add .het to project").disabled).toBe(true);
    vi.mocked(convertHetro).mockResolvedValue(result(exampleText));
    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(button("Download .het").disabled).toBe(false);
    fireEvent.click(button("Add .het to project"));
    expect(save).toHaveBeenCalledOnce();
    expect(button("Add .het to project").disabled).toBe(true);
    edit("invalid");
    expect(button("Download .het").disabled).toBe(true);
    expect(screen.queryByText(/Preview matches/)).toBeNull();
});
it("cancels a slow file load and ignores its late contents", async () => {
    let resolve!: (value: Uint8Array) => void;
    let signal: AbortSignal | undefined;
    mount([
        {
            id: "slow",
            name: "slow.het",
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
    expect(
        screen.getByLabelText("HETRO editor").getAttribute("aria-busy")
    ).toBe("true");
    fireEvent.click(button("Cancel"));
    expect(signal?.aborted).toBe(true);
    await act(async () => resolve(new TextEncoder().encode(exampleText)));
    expect(
        (screen.getByLabelText("HETRO text") as HTMLTextAreaElement).value
    ).toBe("");
    expect(convertHetro).not.toHaveBeenCalled();
});
it("aborts conversion when closing the tool", async () => {
    const { unmount } = mount();
    vi.mocked(convertHetro).mockImplementation(() => new Promise(() => {}));
    fireEvent.click(button("Try example"));
    await act(() => vi.advanceTimersByTimeAsync(400));
    const signal = vi.mocked(convertHetro).mock.calls[0][1];
    unmount();
    expect(signal.aborted).toBe(true);
});
