import { afterEach, expect, it, vi } from "vitest";
import { TableClient } from "./client";
const request = { sampleRate: 48000, tables: [{ fields: [1, 0, 8, 10, 1] }] };
afterEach(() => vi.useRealTimers());
it("reuses the compiled worker after success but terminates pending work", async () => {
    const workers: any[] = [];
    const create = vi.fn(() => {
        const w = {
            postMessage: vi.fn(),
            terminate: vi.fn(),
            onmessage: undefined,
            onerror: undefined
        };
        workers.push(w);
        return w as unknown as Worker;
    });
    const client = new TableClient(create);
    const first = client.generate(request);
    workers[0].onmessage({ data: { samples: new Float64Array([0, 1, 0]) } });
    await expect(first).resolves.toHaveLength(3);
    client.cancelPending();
    const second = client.generate(request);
    expect(create).toHaveBeenCalledTimes(1);
    const rejected = expect(second).rejects.toMatchObject({
        name: "AbortError"
    });
    const third = client.generate(request);
    await rejected;
    expect(workers[0].terminate).toHaveBeenCalledOnce();
    workers[1].onmessage({ data: { samples: new Float64Array([1, 0, 1]) } });
    await expect(third).resolves.toHaveLength(3);
    client.dispose();
});
it("times out a stuck GEN and can retry", async () => {
    vi.useFakeTimers();
    const worker = { postMessage: vi.fn(), terminate: vi.fn() };
    const client = new TableClient(() => worker as unknown as Worker);
    const result = expect(client.generate(request)).rejects.toThrow(/too long/);
    await vi.advanceTimersByTimeAsync(5000);
    await result;
    expect(worker.terminate).toHaveBeenCalledOnce();
    client.dispose();
});
