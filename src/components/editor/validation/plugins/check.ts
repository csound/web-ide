import { checker } from "../client";
import type { CheckRequest, CheckResult } from "../types";
import { emptyMetadata, type PluginMetadata } from "./types";

export async function checkWithPlugins(
    request: CheckRequest,
    signal: AbortSignal,
    resolve: () => Promise<PluginMetadata>,
    execute: (
        request: CheckRequest,
        signal: AbortSignal
    ) => Promise<CheckResult> = (data, abort) => checker.check(data, abort)
): Promise<CheckResult> {
    let metadata: PluginMetadata;
    try {
        metadata = request.pluginRequests?.length
            ? await resolve()
            : emptyMetadata();
    } catch {
        signal.throwIfAborted();
        return {
            available: true,
            valid: false,
            udosComplete: false,
            plugins: [],
            pluginTypes: [],
            diagnostics: (request.pluginRequests ?? [])
                .slice(0, 1)
                .map(({ path, line }) => ({
                    filename: request.filename,
                    line,
                    message: `Could not inspect opcode plugin: ${path || "missing path"}. Check that the project file is available and compatible.`
                }))
        };
    }
    signal.throwIfAborted();
    const plugins = { plugins: metadata.opcodes, pluginTypes: metadata.types };
    return {
        ...(await execute({ ...request, ...plugins }, signal)),
        ...plugins
    };
}
