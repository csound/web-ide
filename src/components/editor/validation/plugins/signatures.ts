export interface OpcodeSignature {
    opname: string;
    outypes: string;
    intypes: string;
}

export const MAX_PLUGIN_BYTES = 16 * 1024 * 1024;
export const MAX_PLUGIN_SIGNATURES = 2048;

/** Plain metadata only: no code or function pointers enter the small checker. */
export function validateSignatures(value: unknown): OpcodeSignature[] {
    if (!Array.isArray(value) || value.length > MAX_PLUGIN_SIGNATURES)
        throw new Error("Plugin opcode list is too large");
    let size = 0;
    for (const entry of value) {
        if (!entry || typeof entry !== "object")
            throw new Error("Invalid plugin opcode");
        for (const [field, limit] of [
            ["opname", 255],
            ["outypes", 512],
            ["intypes", 512]
        ] as const) {
            const text = entry[field];
            if (
                typeof text !== "string" ||
                text.length > limit ||
                /[^\x20-\x7e]|\t/.test(text)
            )
                throw new Error("Invalid plugin opcode signature");
            size += text.length;
        }
        if (!entry.opname) throw new Error("Missing plugin opcode name");
    }
    if (size > 1024 * 1024)
        throw new Error("Plugin opcode metadata is too large");
    return value.map(({ opname, outypes, intypes }) => ({
        opname,
        outypes,
        intypes
    }));
}

export const opcodeName = (signature: OpcodeSignature) =>
    signature.opname.split(".")[0];
