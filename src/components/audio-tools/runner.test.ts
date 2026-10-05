import { afterEach, expect, it, vi } from "vitest";
import { runTool } from "./runner";
import type { ToolRequest } from "./types";

const request: ToolRequest = {
    tool: "envext",
    args: [],
    files: [],
    output: "out.txt"
};
afterEach(() => vi.unstubAllGlobals());
function setup() {
    const worker = {
        terminate: vi.fn(),
        postMessage: vi.fn(),
        onmessage: undefined as ((event: MessageEvent) => void) | undefined,
        onerror: undefined as (() => void) | undefined
    };
    const create = vi.fn(function () {
        return worker;
    });
    vi.stubGlobal("Worker", create);
    return { worker, create };
}
it("starts no worker until a tool is requested, then closes it after the result", async () => {
    const { worker, create } = setup();
    expect(create).not.toHaveBeenCalled();
    const status = vi.fn();
    const task = runTool(request, new AbortController().signal, status);
    expect(create).toHaveBeenCalledTimes(1);
    expect(worker.postMessage).toHaveBeenCalledWith(request);
    worker.onmessage?.({
        data: { type: "status", text: "Processing audio…" }
    } as MessageEvent);
    expect(status).toHaveBeenCalledWith("Processing audio…");
    const result = { data: new Uint8Array([1]), log: "" };
    worker.onmessage?.({ data: { type: "result", result } } as MessageEvent);
    await expect(task).resolves.toEqual(result);
    expect(worker.terminate).toHaveBeenCalledOnce();
});
it("terminates running WASM on cancel", async () => {
    const { worker } = setup();
    const controller = new AbortController();
    const task = runTool(request, controller.signal, () => {});
    controller.abort();
    await expect(task).rejects.toMatchObject({ name: "AbortError" });
    expect(worker.terminate).toHaveBeenCalledOnce();
});
it("does not start cancelled work and releases workers on failure", async () => {
    const { worker, create } = setup();
    const controller = new AbortController();
    controller.abort();
    await expect(
        runTool(request, controller.signal, () => {})
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(create).not.toHaveBeenCalled();
    const task = runTool(request, new AbortController().signal, () => {});
    worker.onerror?.();
    await expect(task).rejects.toThrow("worker stopped");
    expect(worker.terminate).toHaveBeenCalledOnce();
});
