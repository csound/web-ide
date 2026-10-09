import { validateSignatures, type OpcodeSignature } from "./signatures";

export interface PluginType {
    name: string;
    argtype: number;
    struct: boolean;
    members: { name: string; type: string; dimensions: number }[];
}
export interface PluginMetadata {
    opcodes: OpcodeSignature[];
    types: PluginType[];
}
export const emptyMetadata = (): PluginMetadata => ({ opcodes: [], types: [] });

export function validateTypes(value: unknown): PluginType[] {
    if (!Array.isArray(value) || value.length > 256)
        throw new Error("Invalid plugin types");
    const names = new Set<string>();
    let count = 0;
    const name = (text: unknown): text is string =>
        typeof text === "string" &&
        text.length > 0 &&
        text.length <= 255 &&
        !/[^\x20-\x7e]/.test(text);
    return value.map((type) => {
        if (
            !type ||
            !name(type.name) ||
            names.has(type.name) ||
            ![0, 1, 2].includes(type.argtype) ||
            typeof type.struct !== "boolean" ||
            !Array.isArray(type.members)
        )
            throw new Error("Invalid plugin type");
        names.add(type.name);
        const members = new Set<string>();
        return {
            name: type.name,
            argtype: type.argtype,
            struct: type.struct,
            members: type.members.map(
                (member: PluginType["members"][number]) => {
                    if (
                        ++count > 2048 ||
                        !member ||
                        !name(member.name) ||
                        !name(member.type) ||
                        members.has(member.name) ||
                        !Number.isInteger(member.dimensions) ||
                        member.dimensions < 0 ||
                        member.dimensions > 32 ||
                        !type.struct
                    )
                        throw new Error("Invalid plugin type member");
                    members.add(member.name);
                    return {
                        name: member.name,
                        type: member.type,
                        dimensions: member.dimensions
                    };
                }
            )
        };
    });
}

export function validateMetadata(value: PluginMetadata): PluginMetadata {
    const result = {
        opcodes: validateSignatures(value.opcodes),
        types: validateTypes(value.types)
    };
    if (JSON.stringify(result).length > 1024 * 1024)
        throw new Error("Plugin metadata is too large");
    return result;
}

/** The helper reports descriptors, never pointers or executable callbacks. */
export function readTypes(lines: string[]): PluginType[] {
    const types = new Map<string, PluginType>();
    if (lines.at(-1) !== "@ide-types-end")
        throw new Error("Incomplete plugin types");
    for (const line of lines.slice(0, -1)) {
        const [kind, owner, first, second, third, extra] = line.split("\t");
        if (extra !== undefined) throw new Error("Invalid type record");
        if (kind === "@ide-type" && third === undefined) {
            if (types.has(owner) || !["0", "1"].includes(second))
                throw new Error("Invalid type record");
            types.set(owner, {
                name: owner,
                argtype: Number(first),
                struct: second === "1",
                members: []
            });
        } else if (kind === "@ide-member" && types.has(owner)) {
            types.get(owner)!.members.push({
                name: first,
                type: second,
                dimensions: Number(third)
            });
        } else throw new Error("Invalid type record");
    }
    return validateTypes([...types.values()]);
}

export const typeName = (name: string) => name.replace(/^:(.*);$/, "$1");

export function typeRecords(types: PluginType[]): string {
    return (
        types
            .map(
                (type) =>
                    `T\t${type.name}\t${type.argtype}\t${Number(type.struct)}\n`
            )
            .join("") +
        types
            .flatMap((type) =>
                type.members.map(
                    (member) =>
                        `M\t${type.name}\t${member.name}\t${member.type}\t${member.dimensions}\n`
                )
            )
            .join("")
    );
}
