import { WASI, File, OpenFile, ConsoleStdout } from "@bjorn3/browser_wasi_shim";
import { MAX_SAMPLES, type TableRequest } from "./source";

export async function generateTable(
    module: WebAssembly.Module,
    request: TableRequest
): Promise<Float64Array> {
    if (
        !Number.isFinite(request.sampleRate) ||
        request.sampleRate < 8000 ||
        request.sampleRate > 384000 ||
        !request.tables.length ||
        request.tables.length > 32
    )
        throw new Error("Invalid table preview request.");
    const records = request.tables.map(({ fields, gen }) => {
        if (
            fields.length < 5 ||
            fields.length > 1024 ||
            fields.some((n) => !Number.isFinite(n) || Math.abs(n) > 1e9) ||
            (gen && !/^(?:tanh|exp|sone|quadbezier)$/.test(gen))
        )
            throw new Error(
                "This GEN or its parameters are not supported by the preview."
            );
        return `${fields.length} ${gen || "-"} ${fields.join(" ")}`;
    });
    const input = new TextEncoder().encode(
        `${records.length} ${request.sampleRate}\n${records.join("\n")}\n`
    );
    let used = 0,
        log = "";
    const output = new Uint8Array(4 + (MAX_SAMPLES + 1) * 8);
    const decoder = new TextDecoder();
    const wasi = new WASI(
        [],
        [],
        [
            new OpenFile(new File(input, { readonly: true })),
            new ConsoleStdout((bytes) => {
                if (used + bytes.length > output.length)
                    throw new Error("Table exceeds the preview limit.");
                output.set(bytes, used);
                used += bytes.length;
            }),
            new ConsoleStdout((bytes) => {
                log = (log + decoder.decode(bytes, { stream: true })).slice(
                    0,
                    4096
                );
            })
        ]
    );
    const instance = await WebAssembly.instantiate(module, {
        wasi_snapshot_preview1: wasi.wasiImport
    });
    const { memory, _start } = instance.exports;
    if (!(memory instanceof WebAssembly.Memory) || typeof _start !== "function")
        throw new Error("Table preview is unavailable.");
    const status = wasi.start({ exports: { memory, _start: () => _start() } });
    if (status !== 0)
        throw new Error(
            log.trim().split("\n")[0] || "Csound could not generate this table."
        );
    const length = new DataView(output.buffer).getUint32(0, true);
    if (!length || length > MAX_SAMPLES || used !== 4 + (length + 1) * 8)
        throw new Error("Invalid table preview output.");
    return new Float64Array(output.buffer.slice(4, used));
}
