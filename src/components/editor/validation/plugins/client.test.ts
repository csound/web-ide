import { afterEach, expect, it, vi } from "vitest";
import { probePlugins } from "./client";
afterEach(() => vi.useRealTimers());
const fakeWorker = () => ({
    onmessage: undefined as any,
    onerror: undefined as any,
    postMessage: vi.fn(),
    terminate: vi.fn()
});
it("terminates a stuck plugin without disabling later inspections", async () => {
    vi.useFakeTimers();
    const worker = fakeWorker();
    const pending = expect(
        probePlugins(
            [],
            new AbortController().signal,
            () => worker as unknown as Worker
        )
    ).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(8000);
    await pending;
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    const next = fakeWorker();
    const result = probePlugins(
        [],
        new AbortController().signal,
        () => next as unknown as Worker
    );
    next.onmessage({
        data: {
            metadata: {
                opcodes: [{ opname: "hello440", outypes: "a", intypes: "" }],
                types: []
            }
        }
    });
    expect((await result).opcodes).toHaveLength(1);
    expect(next.terminate).toHaveBeenCalledTimes(1);
});
it("rejects malformed metadata and stops the worker on abort", async () => {
    const worker = fakeWorker();
    const controller = new AbortController();
    const result = probePlugins(
        [],
        controller.signal,
        () => worker as unknown as Worker
    );
    controller.abort();
    await expect(result).rejects.toThrow("cancelled");
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    const next = fakeWorker();
    const malformed = probePlugins(
        [],
        new AbortController().signal,
        () => next as unknown as Worker
    );
    next.onmessage({
        data: {
            metadata: {
                types: [],
                opcodes: [
                    { opname: "injected\nsource", outypes: "a", intypes: "" }
                ]
            }
        }
    });
    await expect(malformed).rejects.toThrow("Invalid");
    expect(next.terminate).toHaveBeenCalledTimes(1);
});
