import {
    WASI,
    File,
    OpenFile,
    ConsoleStdout,
    PreopenDirectory
} from "@bjorn3/browser_wasi_shim";
import type { ToolRequest, ToolResult } from "./types";

/** Run one WASI command in an isolated memory filesystem and return its output and bounded log. */
// The worker owns this filesystem. Tools cannot reach project files or the host.
export async function executeTool(
    module: WebAssembly.Module,
    request: ToolRequest
): Promise<ToolResult> {
    const files = new Map(
        request.files.map(({ name, data }) => [name, new File(data)])
    );
    const stdout = new File([]);
    const directory = new PreopenDirectory("/", files);
    let log = "";
    const decoder = new TextDecoder();
    const wasi = new WASI(
        [request.tool, ...request.args],
        [],
        [
            new OpenFile(new File([])),
            new OpenFile(stdout),
            new ConsoleStdout((bytes) => {
                // Keep a bounded tail even for verbose, long-running analyses.
                log = (log + decoder.decode(bytes, { stream: true })).slice(
                    -16000
                );
            }),
            directory
        ]
    );
    const instance = await WebAssembly.instantiate(module, {
        wasi_snapshot_preview1: wasi.wasiImport
    });
    const { memory, _start } = instance.exports;
    if (!(memory instanceof WebAssembly.Memory) || typeof _start !== "function")
        throw new Error("This tool cannot run in this browser.");
    const status = wasi.start({ exports: { memory, _start: () => _start() } });
    log += decoder.decode();
    if (status !== 0)
        throw new Error(log.trim() || `The tool stopped (code ${status}).`);
    const output =
        request.output === "stdout"
            ? stdout
            : directory.dir.contents.get(request.output);
    if (!(output instanceof File) || !output.data.length)
        throw new Error(
            "The tool did not create a result. Try different settings."
        );
    return { data: output.data, log };
}
