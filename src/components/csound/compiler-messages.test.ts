import { expect, it, vi } from "vitest";
import { waitForCompilerMessages } from "./compiler-messages";

it("waits for queued diagnostics to settle and bounds a continuing stream", async () => {
    vi.useFakeTimers();
    try {
        let count = 0;
        const completed = vi.fn();
        const controller = new AbortController();
        const waiting = waitForCompilerMessages(
            () => count,
            controller.signal
        ).then(completed);
        count++;
        await vi.advanceTimersByTimeAsync(20);
        expect(completed).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(20);
        await waiting;
        expect(completed).toHaveBeenCalledOnce();
        const stream = waitForCompilerMessages(
            () => count++,
            controller.signal
        );
        await vi.advanceTimersByTimeAsync(260);
        await stream;
        expect(vi.getTimerCount()).toBe(0);
        controller.abort();
        await waitForCompilerMessages(() => count, controller.signal);
        expect(vi.getTimerCount()).toBe(0);
    } finally {
        vi.useRealTimers();
    }
});
