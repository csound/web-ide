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
import PvxTool from "./pvx-tool";
import { exampleText, formatPvx, parsePvxText } from "./format";
import { openPvxFile, updatePvx } from "./client";
import type { AudioSource } from "../audio-tools/audio-tool";
vi.mock("./client", () => ({ updatePvx: vi.fn(), openPvxFile: vi.fn() }));
vi.mock("../score-tools/code-pane", () => ({
    CodePane: ({
        value,
        onChange,
        label,
        revealLine
    }: {
        value: string;
        onChange?: (value: string) => void;
        label: string;
        revealLine?: { line: number };
    }) => (
        <textarea
            aria-label={label}
            data-reveal-line={revealLine?.line}
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
    const save = vi.fn(() => "analysis.pvx");
    const view = render(
        <ThemeProvider
            theme={createTheme({
                ...theme,
                font: { regular: "sans-serif", monospace: "monospace" }
            })}
        >
            <PvxTool sources={sources} onSave={save} />
        </ThemeProvider>
    );
    return { ...view, save };
}
function edit(text: string) {
    fireEvent.change(screen.getByLabelText("PVX text"), {
        target: { value: text }
    });
}
const button = (name: string) =>
    screen.getByRole("button", { name, exact: true }) as HTMLButtonElement;
const result = (text: string) => ({
    name: "analysis.pvx",
    data: new Uint8Array([1, 0]),
    text,
    firstDataRow: 5,
    analysis: parsePvxText(text)
});
function stereoText(frames = 32) {
    const analysis = parsePvxText(exampleText);
    analysis.wave[1] = 2;
    analysis.wave[3] *= 2;
    analysis.wave[4] *= 2;
    analysis.values = analysis.values.slice(0, frames * 132);
    return formatPvx(analysis);
}
const chooseFrame = (frame: number) =>
    fireEvent.change(screen.getByLabelText("Frame number"), {
        target: { value: String(frame) }
    });
const chooseChannel = (channel: number) =>
    fireEvent.change(screen.getByLabelText("Channel"), {
        target: { value: String(channel) }
    });
function expectSelection(frame: number, channel: number) {
    expect(
        (screen.getByLabelText("Frame number") as HTMLInputElement).value
    ).toBe(String(frame));
    expect((screen.getByLabelText("Channel") as HTMLSelectElement).value).toBe(
        String(channel)
    );
}
it("uses the original text's first frame row for its label and reveal action", async () => {
    mount();
    vi.mocked(updatePvx).mockResolvedValue({
        ...result(stereoText()),
        firstDataRow: 7
    });
    edit("\n\n" + stereoText());
    await act(() => vi.advanceTimersByTimeAsync(400));
    chooseFrame(17);
    chooseChannel(1);
    expect(screen.getByText(/Text row 40\./)).toBeDefined();
    fireEvent.click(button("Show text row"));
    expect(
        screen.getByLabelText("PVX text").getAttribute("data-reveal-line")
    ).toBe("40");
});
it("retains navigation through pending and invalid edits, clamps smaller data, and resets on another file", async () => {
    mount([
        { id: "other", name: "other.txt", load: async () => new Uint8Array() }
    ]);
    vi.mocked(updatePvx).mockImplementation(async ({ text }) => result(text));
    vi.mocked(openPvxFile).mockResolvedValue(stereoText());
    edit(stereoText());
    await act(() => vi.advanceTimersByTimeAsync(400));
    chooseFrame(17);
    chooseChannel(1);
    edit(stereoText() + "\n");
    expect(button("Download .pvx").disabled).toBe(true);
    expect(screen.queryByLabelText("Frame number")).toBeNull();
    await act(() => vi.advanceTimersByTimeAsync(400));
    expectSelection(17, 1);
    edit("invalid");
    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(screen.getByRole("alert")).toBeDefined();
    expect(button("Add .pvx to project").disabled).toBe(true);
    edit(stereoText());
    await act(() => vi.advanceTimersByTimeAsync(400));
    expectSelection(17, 1);
    const smaller = parsePvxText(exampleText);
    smaller.values = smaller.values.slice(0, 3 * 66);
    edit(formatPvx(smaller));
    await act(() => vi.advanceTimersByTimeAsync(400));
    expectSelection(3, 0);
    edit(stereoText());
    await act(() => vi.advanceTimersByTimeAsync(400));
    expectSelection(3, 0);
    chooseFrame(17);
    chooseChannel(1);
    await act(async () =>
        fireEvent.change(screen.getByLabelText("Project analysis file"), {
            target: { value: "other" }
        })
    );
    await act(() => vi.advanceTimersByTimeAsync(400));
    expectSelection(1, 0);
});
it("debounces text, blocks old output, and never saves a cancelled result", async () => {
    const { save } = mount();
    let resolve!: (value: ReturnType<typeof result>) => void;
    vi.mocked(updatePvx).mockImplementation(
        () =>
            new Promise((done) => {
                resolve = done;
            })
    );
    fireEvent.click(button("Try example"));
    await act(() => vi.advanceTimersByTimeAsync(399));
    expect(updatePvx).not.toHaveBeenCalled();
    edit(exampleText + "\n");
    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(updatePvx).toHaveBeenCalledOnce();
    const signal = vi.mocked(updatePvx).mock.calls[0][1];
    expect(button("Download .pvx").disabled).toBe(true);
    fireEvent.click(button("Reset edits"));
    expect(signal.aborted).toBe(true);
    await act(async () => resolve(result(exampleText + "\n")));
    expect(button("Add .pvx to project").disabled).toBe(true);
    vi.mocked(updatePvx).mockResolvedValue(result(exampleText));
    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(button("Download .pvx").disabled).toBe(false);
    fireEvent.click(button("Add .pvx to project"));
    expect(save).toHaveBeenCalledOnce();
    expect(button("Add .pvx to project").disabled).toBe(true);
    edit("invalid");
    expect(button("Download .pvx").disabled).toBe(true);
    expect(screen.queryByText(/Preview matches/)).toBeNull();
});
it("cancels a slow file load and ignores its late contents", async () => {
    let resolve!: (value: Uint8Array) => void;
    let signal: AbortSignal | undefined;
    mount([
        {
            id: "slow",
            name: "slow.pvx",
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
    expect(screen.getByLabelText("PVX editor").getAttribute("aria-busy")).toBe(
        "true"
    );
    fireEvent.click(button("Cancel"));
    expect(signal?.aborted).toBe(true);
    await act(async () => resolve(new TextEncoder().encode(exampleText)));
    expect(
        (screen.getByLabelText("PVX text") as HTMLTextAreaElement).value
    ).toBe("");
    expect(updatePvx).not.toHaveBeenCalled();
});
it("aborts conversion when closing the tool", async () => {
    const { unmount } = mount();
    vi.mocked(updatePvx).mockImplementation(() => new Promise(() => {}));
    fireEvent.click(button("Try example"));
    await act(() => vi.advanceTimersByTimeAsync(400));
    const signal = vi.mocked(updatePvx).mock.calls[0][1];
    unmount();
    expect(signal.aborted).toBe(true);
});
