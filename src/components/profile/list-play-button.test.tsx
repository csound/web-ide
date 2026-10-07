import { afterEach, expect, it, vi } from "vitest";
import {
    act,
    cleanup,
    fireEvent,
    render,
    screen
} from "@testing-library/react";
import { Provider } from "react-redux";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { store } from "../../store";
import palette from "../../styles/_theme-monokai";
import { playListItem } from "./actions";
import { ListPlayButton } from "./list-play-button";

vi.mock("./actions", () => ({ playListItem: vi.fn() }));
afterEach(() => {
    cleanup();
    vi.resetAllMocks();
});

function setup() {
    store.dispatch({ type: "CSOUND.SET_CSOUND_PLAY_STATE", status: "stopped" });
    return render(
        <Provider store={store}>
            <ThemeProvider
                theme={createTheme({
                    ...palette,
                    font: { regular: "sans-serif", monospace: "monospace" }
                })}
            >
                <ListPlayButton projectUid="card" projectName="Demo" />
            </ThemeProvider>
        </Provider>
    );
}

it("clears Starting after a rejection and lets the listener retry", async () => {
    let reject!: (reason: Error) => void;
    vi.mocked(playListItem).mockReturnValueOnce(
        () =>
            new Promise((_, fail) => {
                reject = fail;
            })
    );
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Play Demo" }));
    expect(
        screen
            .getByRole("button", { name: "Starting Demo" })
            .getAttribute("aria-busy")
    ).toBe("true");
    await act(async () => reject(new Error("Compilation failed")));
    expect(
        screen
            .getByRole("button", { name: "Play Demo" })
            .getAttribute("aria-busy")
    ).toBe("false");
    vi.mocked(playListItem).mockReturnValueOnce(async () => {});
    await act(async () =>
        fireEvent.click(screen.getByRole("button", { name: "Play Demo" }))
    );
    expect(playListItem).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("button", { name: "Starting Demo" })).toBeNull();
});

it("cancels pending playback when the card leaves the page", async () => {
    let finish!: () => void;
    vi.mocked(playListItem).mockReturnValueOnce(
        () =>
            new Promise((resolve) => {
                finish = resolve;
            })
    );
    const view = setup();
    fireEvent.click(screen.getByRole("button", { name: "Play Demo" }));
    const signal = vi.mocked(playListItem).mock.calls[0][0].signal!;
    view.unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => finish());
});

it("does not abort started playback when its card is filtered out", async () => {
    vi.mocked(playListItem).mockReturnValueOnce(async () => {});
    const view = setup();
    await act(async () =>
        fireEvent.click(screen.getByRole("button", { name: "Play Demo" }))
    );
    const signal = vi.mocked(playListItem).mock.calls[0][0].signal!;
    view.unmount();
    expect(signal.aborted).toBe(false);
});
