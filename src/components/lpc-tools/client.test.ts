import { afterEach, expect, it, vi } from "vitest";
import { openLpcFile, updateLpc } from "./client";
afterEach(() => vi.unstubAllGlobals());
function worker() {
    const instance = {
        terminate: vi.fn(),
        postMessage: vi.fn(),
        onmessage: undefined as
            | ((event: { data: unknown }) => void)
            | undefined,
        onerror: undefined as (() => void) | undefined
    };
    const create = vi.fn(function () {
        return instance;
    });
    vi.stubGlobal("Worker", create);
    return { instance, create };
}
it("does not start workers until requested and terminates on cancellation", async () => {
    const { instance, create } = worker();
    expect(create).not.toHaveBeenCalled();
    const controller = new AbortController();
    const result = updateLpc(
        { text: "text", name: "analysis" },
        controller.signal,
        () => {}
    );
    expect(create).toHaveBeenCalledOnce();
    controller.abort();
    await expect(result).rejects.toMatchObject({ name: "AbortError" });
    expect(instance.terminate).toHaveBeenCalledOnce();
});
it("forwards status and frees the worker after a completed conversion", async () => {
    const { instance } = worker();
    const status = vi.fn();
    const result = openLpcFile(
        { name: "file.lpc", data: new Uint8Array([1]) },
        new AbortController().signal,
        status
    );
    instance.onmessage?.({ data: { type: "status", text: "Reading…" } });
    instance.onmessage?.({ data: { type: "result", value: "converted text" } });
    expect(await result).toBe("converted text");
    expect(status).toHaveBeenCalledWith("Reading…");
    expect(instance.terminate).toHaveBeenCalledOnce();
});
it("frees the worker on crashes and does not start an already cancelled request", async () => {
    const { instance, create } = worker();
    const result = updateLpc(
        { text: "bad", name: "file" },
        new AbortController().signal,
        () => {}
    );
    instance.onerror?.();
    await expect(result).rejects.toThrow("converter stopped");
    expect(instance.terminate).toHaveBeenCalledOnce();
    const controller = new AbortController();
    controller.abort();
    await expect(
        updateLpc({ text: "bad", name: "file" }, controller.signal, () => {})
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(create).toHaveBeenCalledOnce();
});
