// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { PluginMetadataCache } from "./cache";
const signature = {
    opcodes: [{ opname: "hello440", outypes: "a", intypes: "" }],
    types: []
};
afterEach(() => vi.useRealTimers());

it("deduplicates work, skips unchanged downloads, hashes replacements, and scopes caches to a project", async () => {
    const inspect = vi.fn(async () => signature);
    const cache = new PluginMetadataCache(inspect);
    const load = vi.fn(async () => new Uint8Array([1, 2, 3]));
    const files = [{ name: "test.wasm", revision: "1", load }];
    const first = cache.get("project-one", files);
    expect(cache.get("project-one", files)).toBe(first);
    expect(await first).toEqual(signature);
    await cache.get("project-one", files);
    expect(load).toHaveBeenCalledTimes(1);
    await cache.get("project-one", [
        { ...files[0], name: "renamed.wasm", revision: "2" }
    ]);
    expect(load).toHaveBeenCalledTimes(2);
    expect(inspect).toHaveBeenCalledTimes(1);
    await cache.get("project-one", [
        { ...files[0], revision: "3", load: async () => new Uint8Array([4]) }
    ]);
    expect(inspect).toHaveBeenCalledTimes(2);
    await cache.get("project-two", files);
    expect(inspect).toHaveBeenCalledTimes(3);
    expect(await cache.get("project-one", [])).toEqual({
        opcodes: [],
        types: []
    });
});

it("bounds a stalled file reader, cools down failures, and permits changed files immediately", async () => {
    vi.useFakeTimers();
    const inspect = vi.fn(async () => signature);
    const cache = new PluginMetadataCache(inspect);
    const stalled = {
        name: "test.wasm",
        revision: "1",
        load: () => new Promise<Uint8Array>(() => {})
    };
    const result = expect(cache.get("project", [stalled])).rejects.toThrow(
        "timed out"
    );
    await vi.advanceTimersByTimeAsync(20000);
    await result;
    await expect(cache.get("project", [stalled])).rejects.toThrow(
        "recently failed"
    );
    expect(
        await cache.get("project", [
            { ...stalled, revision: "2", load: async () => new Uint8Array([1]) }
        ])
    ).toEqual(signature);
});
