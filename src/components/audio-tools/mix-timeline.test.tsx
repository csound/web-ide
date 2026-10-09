import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import colors from "../../styles/_theme-github-light";
import { MixTimeline } from "./mix-timeline";
import { trackDefaults } from "./mixer";
const track = {
    ...trackDefaults,
    id: "clip",
    name: "clip.wav",
    data: new Uint8Array(),
    audio: {
        sampleRate: 8000,
        channels: [new Float32Array(8000), new Float32Array(8000)]
    }
};
afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});
it("commits a drag on the new scale and lets numeric edits and reset move the clip", () => {
    vi.stubGlobal(
        "ResizeObserver",
        class {
            observe() {}
            disconnect() {}
        }
    );
    vi.stubGlobal("PointerEvent", MouseEvent);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const theme = createTheme({
        ...colors,
        font: { regular: "sans-serif", monospace: "monospace" }
    });
    const move = vi.fn();
    const ui = (start: number, span: number) => (
        <ThemeProvider theme={theme}>
            <MixTimeline
                track={{ ...track, start }}
                span={span}
                audible
                onMove={move}
            />
        </ThemeProvider>
    );
    const view = render(ui(0, 2));
    const clip = screen.getByRole("slider");
    const clock = view.container.querySelector("output")!;
    Object.defineProperty(clip.parentElement, "clientWidth", { value: 100 });
    Object.defineProperty(clip, "setPointerCapture", { value: vi.fn() });
    fireEvent.pointerDown(clip, { button: 0, clientX: 0 });
    fireEvent.pointerMove(clip, { clientX: 50 });
    expect(clip.style.left).toBe("50%");
    expect(clock.textContent).toBe("1.00 s");
    expect(move).not.toHaveBeenCalled();
    fireEvent.pointerUp(clip);
    expect(move).toHaveBeenCalledWith(1);
    view.rerender(ui(1, 2.4));
    expect(clock.textContent).toBe("1.00 s");
    expect(Number.parseFloat(getComputedStyle(clip).left)).toBeCloseTo(
        100 / 2.4
    );
    view.rerender(ui(0.5, 2));
    expect(getComputedStyle(clip).left).toBe("25%");
    expect(clock.textContent).toBe("0.50 s");
    view.rerender(ui(0, 2));
    expect(getComputedStyle(clip).left).toBe("0%");
    expect(clock.textContent).toBe("0.00 s");
    fireEvent.pointerDown(clip, { button: 0, clientX: 0 });
    fireEvent.pointerMove(clip, { clientX: 50 });
    fireEvent.pointerCancel(clip);
    expect(move).toHaveBeenCalledOnce();
    expect(clock.textContent).toBe("0.00 s");
    view.rerender(ui(0.5, 2));
    expect(getComputedStyle(clip).left).toBe("25%");
});
