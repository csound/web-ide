import { afterEach, expect, it, vi } from "vitest";
import { CheckerClient } from "./client";

function setup() {
    const worker = {
        onmessage: undefined as any,
        onerror: undefined as any,
        postMessage: vi.fn(),
        terminate: vi.fn()
    };
    const client = new CheckerClient(() => worker as unknown as Worker);
    return { client, worker };
}
const request = { filename: "main.orc", files: [] };
afterEach(() => vi.useRealTimers());
it("keeps only the newest queued check", async () => {
    const { client, worker } = setup();
    const signal = new AbortController().signal;
    const first = client.check(request, signal);
    const stale = client.check(request, signal);
    const newest = client.check(request, signal);
    expect((await stale).available).toBe(false);
    expect(worker.postMessage).toHaveBeenCalledTimes(1);
    worker.onmessage({ data: { available: true, diagnostics: [] } });
    expect((await first).available).toBe(true);
    expect(worker.postMessage).toHaveBeenCalledTimes(2);
    worker.onmessage({ data: { available: true, diagnostics: [] } });
    expect((await newest).available).toBe(true);
    client.dispose();
});
it("stops a stuck worker and disables repeat failures for this session", async () => {
    vi.useFakeTimers();
    const { client, worker } = setup();
    const result = client.check(request, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(5000);
    expect((await result).available).toBe(false);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    await client.check(request, new AbortController().signal);
    expect(worker.postMessage).toHaveBeenCalledTimes(1);
});
