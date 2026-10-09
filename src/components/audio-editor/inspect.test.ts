import { afterEach, expect, it, vi } from "vitest";
import { inspectMetadata } from "./inspect";
class FakeWorker {
    static last: FakeWorker;
    onmessage?: (event: { data: unknown }) => void;
    onerror?: () => void;
    terminate = vi.fn();
    postMessage = vi.fn();
    constructor() {
        FakeWorker.last = this;
    }
}
afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});
it("transfers a copy and terminates metadata work when its file closes", async () => {
    vi.stubGlobal("Worker", FakeWorker);
    const controller = new AbortController(),
        bytes = new Uint8Array([1, 2]);
    const pending = inspectMetadata(bytes, controller.signal);
    expect(FakeWorker.last.postMessage.mock.calls[0][0]).not.toBe(bytes);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(FakeWorker.last.terminate).toHaveBeenCalledTimes(1);
});
it("terminates a worker after success and ignores later cancellation", async () => {
    vi.stubGlobal("Worker", FakeWorker);
    const controller = new AbortController();
    const pending = inspectMetadata(new Uint8Array([1]), controller.signal);
    FakeWorker.last.onmessage?.({ data: { info: { sampleRate: 22050 } } });
    await expect(pending).resolves.toMatchObject({ sampleRate: 22050 });
    controller.abort();
    expect(FakeWorker.last.terminate).toHaveBeenCalledTimes(1);
});
it("bounds parser time and releases its worker on failure", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("Worker", FakeWorker);
    const pending = inspectMetadata(
        new Uint8Array([1]),
        new AbortController().signal
    );
    const rejection = expect(pending).rejects.toThrow("too long");
    await vi.advanceTimersByTimeAsync(30000);
    await rejection;
    expect(FakeWorker.last.terminate).toHaveBeenCalledTimes(1);
});
