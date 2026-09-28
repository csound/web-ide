import { WebMcpTool } from "./tools";

export interface ModelContext {
    registerTool(
        tool: WebMcpTool,
        options?: { signal: AbortSignal }
    ): void | Promise<void>;
    unregisterTool?(name: string): void;
}

export function pageModelContext(): ModelContext | undefined {
    const candidates = [
        (document as Document & { modelContext?: ModelContext }).modelContext,
        (navigator as Navigator & { modelContext?: ModelContext }).modelContext
    ];
    return candidates.find(
        (context) => typeof context?.registerTool === "function"
    );
}

export async function registerTools(
    tools: WebMcpTool[],
    signal: AbortSignal,
    context = pageModelContext()
): Promise<number> {
    if (
        !context ||
        typeof context.registerTool !== "function" ||
        signal.aborted
    )
        return 0;
    const controller = new AbortController();
    const names: string[] = [];
    const cleanup = () => {
        controller.abort();
        for (const name of names.splice(0)) {
            try {
                context.unregisterTool?.(name);
            } catch {
                /* Already removed by the browser. */
            }
        }
    };
    signal.addEventListener("abort", cleanup, { once: true });
    try {
        for (const tool of tools) {
            if (signal.aborted) return 0;
            await context.registerTool(tool, { signal: controller.signal });
            names.push(tool.name);
            if (signal.aborted) {
                cleanup();
                return 0;
            }
        }
        return names.length;
    } catch (error) {
        cleanup();
        signal.removeEventListener("abort", cleanup);
        throw error;
    }
}
