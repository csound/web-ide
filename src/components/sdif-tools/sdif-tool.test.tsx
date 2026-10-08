import { afterEach, expect, it, vi } from "vitest";
import {
    act,
    cleanup,
    fireEvent,
    render,
    screen
} from "@testing-library/react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import theme from "../../styles/_theme-github-light";
import SdifTool from "./sdif-tool";
import { inspectFile, updateSdif } from "./client";
vi.mock("./client", () => ({ inspectFile: vi.fn(), updateSdif: vi.fn() }));
vi.mock("../audio-tools/visuals", () => ({
    AnalysisGraph: () => <div>Graph</div>
}));
afterEach(() => {
    cleanup();
    vi.resetAllMocks();
    vi.useRealTimers();
});
const result = (name: string) => ({
    name,
    data: new Uint8Array([1]),
    tracks: [{ id: 1, points: new Int16Array([0, 100, 440, 2000, 100, 440]) }],
    duration: 2,
    omitted: 0
});
function mount() {
    vi.mocked(inspectFile).mockResolvedValue([
        { id: 1, frames: 2, partials: 1, start: 0, end: 2 }
    ]);
    const save = vi.fn(() => "saved.het");
    const view = render(
        <ThemeProvider
            theme={createTheme({
                ...theme,
                font: { regular: "sans-serif", monospace: "monospace" }
            })}
        >
            <SdifTool onSave={save} />
        </ThemeProvider>
    );
    return { ...view, save };
}
const disabled = () =>
    screen
        .getByRole("button", { name: "Download .het" })
        .hasAttribute("disabled");
it("debounces edits, cancels old workers, and never publishes a late result", async () => {
    vi.useFakeTimers();
    const { unmount, save } = mount();
    let finish: (value: ReturnType<typeof result>) => void = () => {};
    vi.mocked(updateSdif)
        .mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    finish = resolve;
                })
        )
        .mockResolvedValue(result("new.het"));
    await act(async () =>
        fireEvent.click(screen.getByRole("button", { name: "Try example" }))
    );
    await act(() => vi.advanceTimersByTimeAsync(399));
    expect(updateSdif).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1));
    const signal = vi.mocked(updateSdif).mock.calls[0][1];
    fireEvent.change(screen.getByLabelText("Gain (dB)"), {
        target: { value: "-6" }
    });
    expect(signal.aborted).toBe(true);
    expect(disabled()).toBe(true);
    await act(async () => finish(result("late.het")));
    expect(document.querySelector("pre")).toBeNull();
    fireEvent.change(screen.getByLabelText("Gain (dB)"), {
        target: { value: "-12" }
    });
    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(updateSdif).toHaveBeenCalledTimes(2);
    expect(vi.mocked(updateSdif).mock.calls[1][0].settings.gain).toBe(-12);
    expect(disabled()).toBe(false);
    expect(document.querySelector("pre")?.textContent).toContain("new.het");
    expect(save).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("End (s)"), {
        target: { value: "1" }
    });
    expect(disabled()).toBe(true);
    expect(document.querySelector("pre")).toBeNull();
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(updateSdif).toHaveBeenCalledTimes(2);
});
it("disables exports on conversion errors and resets all settings to recover", async () => {
    vi.useFakeTimers();
    const { save } = mount();
    vi.mocked(updateSdif)
        .mockRejectedValueOnce(new Error("Invalid range"))
        .mockResolvedValue(result("ready.het"));
    await act(async () =>
        fireEvent.click(screen.getByRole("button", { name: "Try example" }))
    );
    fireEvent.change(screen.getByLabelText("End (s)"), {
        target: { value: "0" }
    });
    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(screen.getByRole("alert").textContent).toContain("Invalid range");
    expect(disabled()).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Reset settings" }));
    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(disabled()).toBe(false);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(vi.mocked(updateSdif).mock.calls[1][0].settings).toEqual({
        stream: 1,
        start: 0,
        end: 2,
        partials: 1,
        gain: 0
    });
    fireEvent.click(screen.getByRole("button", { name: "Add to project" }));
    expect(save).toHaveBeenCalledOnce();
    expect(document.querySelector("pre")?.textContent).toContain('"saved.het"');
});
