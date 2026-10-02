// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createReadCache, createRequestLimiter } from "../src/public_requests";

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-02T12:00:00Z"));
});
afterEach(() => vi.useRealTimers());

it("limits bursts, refills one request per second, and caps idle credit", () => {
    const accept = createRequestLimiter();
    for (let index = 0; index < 30; index++) accept();
    expect(accept).toThrow(
        expect.objectContaining({ code: "resource-exhausted" })
    );
    vi.advanceTimersByTime(999);
    expect(accept).toThrow();
    vi.advanceTimersByTime(1);
    accept();
    expect(accept).toThrow();
    vi.advanceTimersByTime(60_000);
    for (let index = 0; index < 30; index++) accept();
    expect(accept).toThrow();
});

it("shares pending loads, caches empty results, and shares an expired refresh", async () => {
    let complete: (value: string[]) => void;
    const load = vi.fn(
        () =>
            new Promise<string[]>((resolve) => {
                complete = resolve;
            })
    );
    const read = createReadCache(load);
    const first = read();
    const concurrent = read();
    expect(load).toHaveBeenCalledTimes(1);
    complete!([]);
    await expect(first).resolves.toEqual([]);
    await expect(concurrent).resolves.toEqual([]);
    await expect(read()).resolves.toEqual([]);
    vi.advanceTimersByTime(5 * 60_000);
    const refresh = read();
    const concurrentRefresh = read();
    expect(load).toHaveBeenCalledTimes(2);
    complete!(["updated"]);
    await expect(refresh).resolves.toEqual(["updated"]);
    await expect(concurrentRefresh).resolves.toEqual(["updated"]);
});

it("does not serve expired data or retry each request after a failed refresh", async () => {
    const failure = new Error("Database unavailable");
    const load = vi
        .fn()
        .mockResolvedValueOnce(["old"])
        .mockRejectedValueOnce(failure)
        .mockResolvedValueOnce(["new"]);
    const read = createReadCache(load);
    await read();
    vi.advanceTimersByTime(5 * 60_000);
    await expect(read()).rejects.toBe(failure);
    await expect(read()).rejects.toBe(failure);
    expect(load).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(5000);
    await expect(read()).resolves.toEqual(["new"]);
});
