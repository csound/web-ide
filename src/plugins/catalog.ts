import catalog from "./catalog.json";
import type { getCsoundHoverInfo } from "@kunstmusik/codemirror-lang-csound";

type HoverInfo = NonNullable<Awaited<ReturnType<typeof getCsoundHoverInfo>>>;
export const bundledOpcodes = new Map(
    catalog.opcodes.map((entry) => [entry.name, entry])
);
export const bundledSignatures = catalog.opcodes.flatMap((entry) =>
    entry.signatures.map((signature) => ({
        opname: entry.name,
        outypes: signature.outTypes,
        intypes: signature.inTypes
    }))
);
export const bundledSemanticSignatures = new Map(
    catalog.opcodes.map((entry) => [entry.name, entry.signatures])
);
export function pluginLabel(name: string): string | undefined {
    const entry = bundledOpcodes.get(name);
    return entry
        ? catalog.groups[entry.plugin as keyof typeof catalog.groups]
        : undefined;
}
export function bundledHoverInfo(name: string): HoverInfo | undefined {
    const entry = bundledOpcodes.get(name);
    return entry
        ? {
              name,
              kind: "builtInOpcode",
              signatures: entry.signatures,
              syntax: entry.syntax,
              shortDescription: entry.description,
              manualId: name
          }
        : undefined;
}
