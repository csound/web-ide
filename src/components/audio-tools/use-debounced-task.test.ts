import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PREVIEW_DELAY, useDebouncedTask } from "./use-debounced-task";

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

it("debounces rapid changes, cancels running work, and ignores late results", async () => {
    vi.useFakeTimers();
    const pending: { resolve: (value: string) => void; signal: AbortSignal }[] =
        [];
    const execute = vi.fn(
        (_request: string, signal: AbortSignal) =>
            new Promise<string>((resolve) => pending.push({ resolve, signal }))
    );
    const { result, rerender, unmount } = renderHook(
        ({ request }: { request?: string }) =>
            useDebouncedTask(request, execute),
        { initialProps: { request: "a" } as { request?: string } }
    );
    await act(() => vi.advanceTimersByTimeAsync(PREVIEW_DELAY - 1));
    rerender({ request: "b" });
    await act(() => vi.advanceTimersByTimeAsync(PREVIEW_DELAY - 1));
    expect(execute).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(execute).toHaveBeenCalledOnce();
    expect(execute.mock.calls[0][0]).toBe("b");
    rerender({ request: "c" });
    expect(pending[0].signal.aborted).toBe(true);
    await act(() => {
        pending[0].resolve("stale");
    });
    expect(result.current.value).toBeUndefined();
    expect(result.current.pending).toBe(true);
    await act(() => vi.advanceTimersByTimeAsync(PREVIEW_DELAY));
    await act(() => {
        pending[1].resolve("latest");
    });
    expect(result.current.value).toBe("latest");
    expect(result.current.pending).toBe(false);
    rerender({ request: undefined });
    expect(result.current.value).toBeUndefined();
    expect(result.current.pending).toBe(false);
    rerender({ request: "d" });
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(PREVIEW_DELAY));
    expect(execute).toHaveBeenCalledTimes(2);
});

it("stops on an error and retries only when requested", async () => {
    vi.useFakeTimers();
    const execute = vi
        .fn()
        .mockRejectedValueOnce(new Error("Failed"))
        .mockResolvedValueOnce("ready");
    const { result } = renderHook(() => useDebouncedTask("request", execute));
    await act(() => vi.advanceTimersByTimeAsync(PREVIEW_DELAY));
    expect(result.current.error).toBe("Failed");
    expect(result.current.pending).toBe(false);
    await act(() => vi.advanceTimersByTimeAsync(PREVIEW_DELAY * 3));
    expect(execute).toHaveBeenCalledOnce();
    act(() => result.current.retry());
    expect(result.current.pending).toBe(true);
    await act(() => vi.advanceTimersByTimeAsync(PREVIEW_DELAY));
    expect(result.current.value).toBe("ready");
    expect(result.current.error).toBeUndefined();
});
