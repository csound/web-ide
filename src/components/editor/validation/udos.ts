import { StateEffect, StateField } from "@codemirror/state";
import type { Completion } from "@codemirror/autocomplete";
import type { getCsoundHoverInfo } from "@kunstmusik/codemirror-lang-csound";
import type { UdoDeclaration } from "./types";
import { opcodeName, type OpcodeSignature } from "./plugins/signatures";
import { typeName, type PluginType } from "./plugins/types";

type HoverInfo = NonNullable<Awaited<ReturnType<typeof getCsoundHoverInfo>>>;

export const setUdoDeclarations = StateEffect.define<UdoDeclaration[]>();
export const setPartialUdoDeclarations = StateEffect.define<UdoDeclaration[]>();
export const setPluginSignatures = StateEffect.define<OpcodeSignature[]>();
export const setPluginTypes = StateEffect.define<PluginType[]>();

function catalog(
    declarations: UdoDeclaration[],
    plugins: OpcodeSignature[],
    types: PluginType[]
) {
    const entries = new Map<string, HoverInfo>();
    for (const plugin of plugins) {
        const name = opcodeName(plugin);
        const entry = entries.get(name) ?? {
            name,
            kind: "userOpcode" as const,
            signatures: [],
            syntax: []
        };
        if (
            !entry.signatures.some(
                (signature) =>
                    signature.inTypes === plugin.intypes &&
                    signature.outTypes === plugin.outypes
            )
        ) {
            entry.signatures.push({
                inTypes: plugin.intypes,
                outTypes: plugin.outypes
            });
            const argumentsFor = (types: string) =>
                (types.match(/(?:\[\])*[a-zA-Z](?:\[\])*|:[^;]+;|./g) ?? [])
                    .map(typeName)
                    .join(", ");
            const outputs = argumentsFor(plugin.outypes);
            const inputs = argumentsFor(plugin.intypes);
            entry.syntax!.push(
                `${outputs ? outputs + " = " : ""}${name}(${inputs})`,
                `${outputs ? outputs + " " : ""}${name}${inputs ? " " + inputs : ""}`
            );
        }
        entries.set(name, entry);
    }
    for (const udo of declarations) {
        const entry = entries.get(udo.name) ?? {
            name: udo.name,
            kind: "userOpcode" as const,
            signatures: [],
            syntax: []
        };
        const signature = {
            inTypes: udo.inputs.map((input) => input.type).join(""),
            outTypes: udo.outputs.join("")
        };
        if (
            !entry.signatures.some(
                (item) =>
                    item.inTypes === signature.inTypes &&
                    item.outTypes === signature.outTypes
            )
        ) {
            entry.signatures.push(signature);
            const outputs = udo.outputs.join(", ");
            const inputs = udo.inputs
                .map((input) =>
                    input.name ? `${input.name}:${input.type}` : input.type
                )
                .join(", ");
            entry.syntax!.push(
                `${outputs ? `${outputs} = ` : ""}${udo.name}(${inputs})`,
                `${outputs ? `${outputs} ` : ""}${udo.name}${inputs ? ` ${inputs}` : ""}`
            );
        }
        entries.set(udo.name, entry);
    }
    const completions: Completion[] = [...entries.values()].map((entry) => ({
        label: entry.name,
        type: "function",
        boost: 20,
        detail: entry.syntax?.[0]
    }));
    return {
        entries,
        completions,
        typeCompletions: types.map(
            (type): Completion => ({
                label: typeName(type.name),
                type: "type",
                detail: type.struct ? "Plugin struct" : "Plugin object"
            })
        ),
        signatures: new Map(
            [...entries].map(([name, entry]) => [name, entry.signatures])
        )
    };
}

// Undefined uses the editor's existing local-file support when WASM is absent.
// Only a successful check can remove confirmed names. Failed checks may supply
// fresh headers, but cannot erase symbols the compiler previously accepted.
export const udoCatalog = StateField.define<
    | (ReturnType<typeof catalog> & {
          confirmed: UdoDeclaration[];
          declarations: UdoDeclaration[];
          plugins: OpcodeSignature[];
          types: PluginType[];
      })
    | undefined
>({
    create: () => undefined,
    update(value, transaction) {
        let confirmed = value?.confirmed ?? [];
        let declarations = value?.declarations ?? [];
        let plugins = value?.plugins ?? [];
        let types = value?.types ?? [];
        let changed = false;
        for (const effect of transaction.effects) {
            if (effect.is(setUdoDeclarations)) {
                declarations = confirmed = effect.value;
                changed = true;
            }
            if (effect.is(setPartialUdoDeclarations)) {
                declarations = [...effect.value, ...confirmed];
                changed = true;
            }
            if (effect.is(setPluginSignatures) && effect.value !== plugins) {
                plugins = effect.value;
                changed = true;
            }
            if (effect.is(setPluginTypes) && effect.value !== types) {
                types = effect.value;
                changed = true;
            }
        }
        return changed
            ? {
                  ...catalog(declarations, plugins, types),
                  confirmed,
                  declarations,
                  plugins,
                  types
              }
            : value;
    }
});
