import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { waitForCompilerMessages } from "./compiler-messages";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
});

it("waits for delayed post-compile diagnostics before accepting a quiet interval", async () => {
    // Earlier compiler logs must not count as new messages after the reply.
    let count = 5;
    const completed = vi.fn();
    const waiting = waitForCompilerMessages(
        () => count,
        new AbortController().signal
    ).then(completed);
    setTimeout(() => count++, 70);
    setTimeout(() => count++, 90);

    await vi.advanceTimersByTimeAsync(60);
    expect(completed).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(40);
    expect(completed).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(20);
    await waiting;
    expect(completed).toHaveBeenCalledOnce();
    expect(count).toBe(7);
    expect(vi.getTimerCount()).toBe(0);
});

it.each([0, 5])(
    "keeps the full grace period when the message count stays at %i",
    async (count) => {
        const completed = vi.fn();
        const waiting = waitForCompilerMessages(
            () => count,
            new AbortController().signal
        ).then(completed);
        await vi.advanceTimersByTimeAsync(249);
        expect(completed).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);
        await waiting;
        expect(completed).toHaveBeenCalledOnce();
        expect(vi.getTimerCount()).toBe(0);
    }
);

it("bounds a continuing stream at 250 ms", async () => {
    let count = 0;
    const messages = setInterval(() => count++, 10);
    const completed = vi.fn();
    const waiting = waitForCompilerMessages(
        () => count,
        new AbortController().signal
    ).then(completed);
    await vi.advanceTimersByTimeAsync(249);
    expect(completed).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await waiting;
    expect(completed).toHaveBeenCalledOnce();
    clearInterval(messages);
    expect(vi.getTimerCount()).toBe(0);
});

it("skips an aborted wait", async () => {
    const controller = new AbortController();
    controller.abort();
    await waitForCompilerMessages(() => 0, controller.signal);
    expect(vi.getTimerCount()).toBe(0);
});

it("stops waiting after cancellation without waiting for the deadline", async () => {
    const controller = new AbortController();
    const waiting = waitForCompilerMessages(() => 0, controller.signal);
    await vi.advanceTimersByTimeAsync(10);
    controller.abort();
    await vi.advanceTimersByTimeAsync(10);
    await waiting;
    expect(vi.getTimerCount()).toBe(0);
});
