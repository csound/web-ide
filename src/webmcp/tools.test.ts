import { describe, expect, it, vi } from "vitest";
import { createTools, ToolError } from "./tools";
import { registerTools } from "./registration";

describe("WebMCP contract", () => {
    it("validates missing, unknown, wrong-type and oversized inputs before dispatch", async () => {
        const execute = vi.fn();
        const tools = createTools(execute);
        const update = tools.find((t) => t.name === "csound_update_document")!;
        for (const input of [
            null,
            [],
            {},
            { document_id: "a", base_revision: "r", source: 3 },
            { document_id: "a", base_revision: "r", source: "", extra: true },
            {
                document_id: "a",
                base_revision: "r",
                source: "x".repeat(1_048_577)
            }
        ]) {
            expect(await update.execute(input)).toMatchObject({
                ok: false,
                error: { code: "invalid_input" }
            });
        }
        expect(
            await tools
                .find((t) => t.name === "csound_read_console")!
                .execute({ limit: 1.5 })
        ).toMatchObject({ ok: false });
        expect(execute).not.toHaveBeenCalled();
    });

    it("returns useful errors and passes cancellation through", async () => {
        const execute = vi.fn(() => {
            throw new ToolError("stale_revision", "Read again.");
        });
        const tool = createTools(execute)[0];
        expect(await tool.execute({})).toEqual({
            ok: false,
            error: { code: "stale_revision", message: "Read again." }
        });
        execute.mockClear();
        expect(
            await tool.execute({}, { signal: AbortSignal.abort() })
        ).toMatchObject({ ok: false, error: { code: "cancelled" } });
        expect(execute).not.toHaveBeenCalled();
    });

    it("registers every schema and removes only its own tools on cleanup", async () => {
        const registered = new Map();
        const controller = new AbortController();
        const context = {
            registerTool: vi.fn(async (tool, { signal }) => {
                registered.set(tool.name, tool);
                signal.addEventListener("abort", () =>
                    registered.delete(tool.name)
                );
            })
        };
        const tools = createTools(() => ({}));
        expect(await registerTools(tools, controller.signal, context)).toBe(
            tools.length
        );
        expect(registered.size).toBe(20);
        expect(
            tools.filter((t) => t.annotations.readOnlyHint).map((t) => t.name)
        ).toEqual([
            "csound_read_workspace",
            "csound_read_document",
            "csound_read_console",
            "csound_read_guide"
        ]);
        controller.abort();
        expect(registered.size).toBe(0);
    });

    it("rolls back a partial registration and cleans up legacy registrations", async () => {
        const tools = createTools(() => ({}));
        const controller = new AbortController();
        const unregisterTool = vi.fn();
        const context = {
            unregisterTool,
            registerTool: vi
                .fn()
                .mockResolvedValueOnce(undefined)
                .mockRejectedValue(new Error("denied"))
        };
        await expect(
            registerTools(tools, controller.signal, context)
        ).rejects.toThrow("denied");
        expect(unregisterTool).toHaveBeenCalledExactlyOnceWith(tools[0].name);
    });

    it("does not leak a legacy tool if cleanup runs during async registration", async () => {
        const controller = new AbortController();
        let resolve!: () => void;
        const context = {
            registerTool: vi.fn(
                () =>
                    new Promise<void>((r) => {
                        resolve = r;
                    })
            ),
            unregisterTool: vi.fn()
        };
        const tools = createTools(() => ({}));
        const promise = registerTools(tools, controller.signal, context);
        controller.abort();
        resolve();
        expect(await promise).toBe(0);
        expect(context.unregisterTool).toHaveBeenCalledExactlyOnceWith(
            tools[0].name
        );
        expect(context.registerTool).toHaveBeenCalledTimes(1);
    });

    it("leaves unsupported browsers alone", async () => {
        expect(
            await registerTools(
                createTools(() => ({})),
                new AbortController().signal
            )
        ).toBe(0);
    });
});
