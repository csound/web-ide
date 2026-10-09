// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { executeTool } from "./wasi";
import type { ToolMessage, ToolRequest } from "./types";

vi.mock("./wasi", () => ({ executeTool: vi.fn() }));
afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.resetModules();
});

it.each([
    "pv_export",
    "pv_import",
    "envext",
    "mixer",
    "mkir",
    "cvanal",
    "csbeats",
    "scot",
    "scsort",
    "extract"
] as const)(
    "loads %s only on request, then transfers the result without cloning it",
    async (tool) => {
        const messages: ToolMessage[] = [];
        const postMessage = vi.fn(
            (message: ToolMessage, options: StructuredSerializeOptions) => {
                messages.push(structuredClone(message, options));
            }
        );
        const scope = {
            postMessage,
            onmessage: undefined as
                | ((event: MessageEvent<ToolRequest>) => Promise<void>)
                | undefined
        };
        vi.stubGlobal("self", scope);
        const fetch = vi.fn(
            async () =>
                new Response(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]))
        );
        vi.stubGlobal("fetch", fetch);
        const data = new Uint8Array([1, 2, 3]);
        vi.mocked(executeTool).mockResolvedValue({ data, log: "done" });
        await import("./tool.worker");
        expect(fetch).not.toHaveBeenCalled();
        await scope.onmessage!({
            data: { tool, args: [], files: [], output: "out.txt" }
        } as MessageEvent<ToolRequest>);
        expect(fetch).toHaveBeenCalledOnce();
        expect(fetch.mock.calls[0][0]).toEqual(
            expect.stringContaining(`${tool}.wasm`)
        );
        expect(messages.at(-1)).toEqual({
            type: "result",
            result: { data: new Uint8Array([1, 2, 3]), log: "done" }
        });
        expect(data.byteLength).toBe(0);
        expect(postMessage.mock.calls.at(-1)?.[1].transfer).toHaveLength(1);
    }
);
