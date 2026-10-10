import {
    WASI,
    File,
    Directory,
    OpenFile,
    PreopenDirectory,
    ConsoleStdout
} from "@bjorn3/browser_wasi_shim";
import { MAX_SOURCE_BYTES } from "./source";
import { readDiagnostics } from "./diagnostics";
import { addUnknownCalls, type UnknownCall } from "./names";
import { validateSignatures } from "./plugins/signatures";
import { validateTypes, typeRecords } from "./plugins/types";
import type { CheckRequest, CheckResult, UdoDeclaration } from "./types";

const encoder = new TextEncoder();

/** Invalid input can be edited and retried without replacing the worker. */
export class CheckRequestError extends Error {}

/** Check one source snapshot in a fresh WASM instance; never perform its orchestra. */
export async function runCheck(
    module: WebAssembly.Module,
    data: CheckRequest
): Promise<CheckResult & { status: number; log: string }> {
    const root = new Directory(new Map());
    const sourcePaths = new Map<string, string | null>();
    let size = 0;
    for (const file of data.files) {
        const parts = file.name.split("/");
        if (
            parts.some(
                (part) =>
                    !part ||
                    part === "." ||
                    part === ".." ||
                    part.includes("\0")
            )
        )
            throw new CheckRequestError("Invalid source path");
        const bytes = encoder.encode(file.text);
        for (let index = 0; index < parts.length; index++) {
            const suffix = parts.slice(index).join("/");
            const existing = sourcePaths.get(suffix);
            sourcePaths.set(
                suffix,
                existing === undefined || existing === file.name
                    ? file.name
                    : null
            );
        }
        size += bytes.length;
        if (size > MAX_SOURCE_BYTES)
            throw new CheckRequestError(
                "Project too large for background checks"
            );
        let directory = root;
        for (const part of parts.slice(0, -1)) {
            if (!directory.contents.has(part))
                directory.contents.set(part, new Directory(new Map()));
            const child = directory.contents.get(part);
            if (!(child instanceof Directory))
                throw new CheckRequestError("Conflicting source paths");
            directory = child;
        }
        if (directory.contents.has(parts.at(-1)!))
            throw new CheckRequestError("Conflicting source paths");
        directory.contents.set(
            parts.at(-1)!,
            new File(bytes, { readonly: true })
        );
    }
    let log = "";
    const decoder = new TextDecoder();
    const output = () =>
        new ConsoleStdout((bytes) => {
            log = (log + decoder.decode(bytes, { stream: true })).slice(-32000);
        });
    const args = ["csound-check", data.filename];
    let metadata: string;
    try {
        const pluginSignatures = validateSignatures(data.plugins ?? []);
        metadata =
            typeRecords(validateTypes(data.pluginTypes ?? [])) +
            pluginSignatures
                .map(
                    ({ opname, outypes, intypes }) =>
                        `O\t${opname}\t${outypes}\t${intypes}\n`
                )
                .join("");
    } catch (error) {
        throw new CheckRequestError("Invalid plugin metadata", {
            cause: error
        });
    }
    let declarations = "";
    const declarationDecoder = new TextDecoder();
    const wasi = new WASI(
        args,
        [],
        [
            new OpenFile(
                new File(encoder.encode(metadata), { readonly: true })
            ),
            new ConsoleStdout((bytes) => {
                // Drop excess metadata rather than let a large source fill the heap.
                if (declarations.length < 1024 * 1024)
                    declarations += declarationDecoder.decode(bytes, {
                        stream: true
                    });
            }),
            output(),
            new PreopenDirectory(".", root.contents)
        ],
        { debug: false }
    );
    // browser_wasi_shim 0.4.2 counts UTF-16 characters here, but args_get writes
    // UTF-8 bytes. Reserve the right space for non-ASCII project filenames.
    // Bind the override before instantiation captures the import functions.
    wasi.wasiImport.args_sizes_get = (argc, argvSize) => {
        const view = new DataView(memory.buffer);
        view.setUint32(argc, args.length, true);
        view.setUint32(
            argvSize,
            args.reduce(
                (size, arg) => size + encoder.encode(arg).length + 1,
                0
            ),
            true
        );
        return 0;
    };
    // A fresh instance per check bounds allocations even after a parser longjmp.
    const instance = await WebAssembly.instantiate(module, {
        wasi_snapshot_preview1: wasi.wasiImport
    });
    const { memory: exportedMemory, _start } = instance.exports;
    if (
        !(exportedMemory instanceof WebAssembly.Memory) ||
        typeof _start !== "function"
    )
        throw new Error("Invalid checker");
    const memory = exportedMemory;
    const status = wasi.start({
        exports: { memory, _start: () => _start() }
    });
    log += decoder.decode();
    declarations += declarationDecoder.decode();
    const records = declarations.split("\n").filter(Boolean);
    // At either cap we cannot prove the list is complete, even if code is valid.
    let udosComplete = declarations.length < 1024 * 1024;
    let declarationCount = 0;
    const udos: UdoDeclaration[] = [];
    const calls: UnknownCall[] = [];
    for (const line of records) {
        try {
            const { origins, ...record } = JSON.parse(line) as (
                UdoDeclaration | UnknownCall
            ) & { origins?: string[] };
            if ("kind" in record && record.kind === "unknownCall") {
                // A macro body has no reliable column in its caller's source.
                // UDO headers can use a parent location; call marks must not.
                const name = (origins?.[0] ?? record.filename).replace(
                    /^(?:\.\/|\/)/,
                    ""
                );
                const filename =
                    name === data.filename ? name : sourcePaths.get(name);
                if (filename) calls.push({ ...record, filename });
                continue;
            }
            declarationCount++;
            const udo = record as UdoDeclaration;
            // Macro expansions add synthetic files to the location stack.
            // Pick the innermost source owned by this project.
            let located = false;
            for (const origin of origins ?? [udo.filename]) {
                const name = origin.replace(/^(?:\.\/|\/)/, "");
                const resolved =
                    name === data.filename ? name : sourcePaths.get(name);
                if (resolved === null) {
                    udosComplete = false;
                    break; // Ambiguous include: do not attribute it to its parent.
                }
                if (!resolved) continue;
                udo.filename = resolved;
                udos.push(udo);
                located = true;
                break;
            }
            if (!located) udosComplete = false;
        } catch {
            // A capped or interrupted metadata stream can end mid-record.
            if (!line.startsWith("{")) log = (log + line + "\n").slice(-32000);
            else udosComplete = false;
        }
    }
    udosComplete &&= declarationCount < 2048;

    return {
        status,
        log,
        available: true,
        valid: status === 0,
        udos,
        udosComplete,
        diagnostics:
            status === 0
                ? []
                : addUnknownCalls(
                      readDiagnostics(
                          log,
                          data.filename,
                          data.files.map((file) => file.name)
                      ),
                      calls,
                      data.files,
                      new Set([
                          ...(data.knownOpcodes ?? []),
                          ...udos.map((udo) => udo.name)
                      ])
                  )
    };
}
