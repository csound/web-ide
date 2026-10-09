import { libcsound } from "@csound/browser";
import {
    MAX_PLUGIN_BYTES,
    validateSignatures,
    type OpcodeSignature
} from "./signatures";
import { readTypes, validateMetadata, type PluginMetadata } from "./types";

/** Runs only in a disposable worker. Plugin registration may execute native
 * module setup, but we never compile an orchestra, start audio or perform it. */
export async function inspectPlugins(
    binaries: Uint8Array[],
    typeReader?: Uint8Array
): Promise<PluginMetadata> {
    if (
        binaries.length > 16 ||
        binaries.reduce((size, data) => size + data.length, 0) >
            MAX_PLUGIN_BYTES
    )
        throw new Error("Plugin set is too large");
    if (
        binaries.some(
            (bytes) =>
                bytes.length < 8 ||
                bytes[0] !== 0 ||
                bytes[1] !== 97 ||
                bytes[2] !== 115 ||
                bytes[3] !== 109
        )
    )
        throw new Error("Invalid WebAssembly plugin");
    const snapshot = async (withPlugins: Uint8Array[]) => {
        typeLines = [];
        const lib = await libcsound({
            withPlugins: typeReader ? [typeReader] : []
        });
        const csound = lib.csoundCreate();
        let factory = 0;
        try {
            // This filesystem method is present but missing from LibCsoundObj.
            const filesystem = lib as typeof lib & {
                writeFile(
                    csound: number,
                    path: string,
                    bytes: Uint8Array
                ): void;
            };
            const paths = withPlugins.map((bytes, index) => {
                const path = `ide-plugin-${String(index).padStart(2, "0")}.wasm`;
                // The bound filesystem API keeps the Csound pointer argument.
                filesystem.writeFile(csound, path, bytes);
                return path;
            });
            if (
                paths.length &&
                lib.csoundSetOption(
                    csound,
                    `--opcode-lib=${paths.join(",")}`
                ) !== 0
            )
                throw new Error("Could not request opcode plugins");
            // withPlugins loads before Csound creates its type pool. Use the
            // filesystem loader after creation, as CsOptions does in playback.
            // Parse only this fixed blank source; never compile or run user code.
            const tree = lib.csoundParseOrc(csound, "\n");
            if (!tree) throw new Error("Could not register opcode plugins");
            lib.wasm.exports.csoundDeleteTree(csound, tree);
            factory = lib.csoundUgenFactoryNew(csound);
            if (typeReader) {
                // Invoke only our reader, after every plugin has registered.
                // The loader may finish instantiating plugins in a different order.
                const reader = lib.csoundUgenNew(
                    factory,
                    "__ide_read_types",
                    "",
                    ""
                );
                if (!reader) throw new Error("Missing plugin type reader");
                try {
                    if (lib.csoundUgenInit(reader) !== 0)
                        throw new Error("Could not read plugin types");
                } finally {
                    lib.csoundUgenDelete(reader);
                }
            }
            return {
                opcodes: lib.csoundUgenListOpcodes(factory),
                types: typeReader ? readTypes(typeLines) : []
            };
        } finally {
            if (factory) lib.csoundUgenFactoryDelete(factory);
            lib.csoundDestroy(csound);
        }
    };
    const key = (entry: OpcodeSignature) =>
        JSON.stringify([entry.opname, entry.outypes, entry.intypes]);
    // The browser loader logs and skips some failed plugins. Treat those as an
    // incomplete inspection, never as a valid empty opcode list. This worker
    // handles one request, so no other task shares its console during the probe.
    const originalError = console.error;
    const originalLog = console.log;
    let typeLines: string[] = [];
    let failed = false;
    console.error = () => {
        failed = true;
    };
    console.log = (message: unknown) => {
        if (typeof message !== "string") return;
        for (const line of message.split("\n")) {
            if (line.startsWith("@ide-")) {
                if (typeLines.length >= 2305 || line.length > 1024)
                    throw new Error("Plugin type metadata is too large");
                typeLines.push(line);
            }
        }
    };
    try {
        const baseline = await snapshot([]);
        const knownOpcodes = new Set(baseline.opcodes.map(key));
        const knownTypes = new Set(baseline.types.map((type) => type.name));
        const loaded = await snapshot(binaries);
        if (failed) throw new Error("Csound could not register the plugin set");
        return validateMetadata({
            opcodes: validateSignatures(
                loaded.opcodes.filter((entry) => !knownOpcodes.has(key(entry)))
            ),
            types: loaded.types.filter((type) => !knownTypes.has(type.name))
        });
    } finally {
        console.error = originalError;
        console.log = originalLog;
    }
}
