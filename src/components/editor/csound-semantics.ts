import {
    analyzeCsoundSemanticLine,
    csoundCsdLanguage,
    csoundOrcLanguage
} from "@kunstmusik/codemirror-lang-csound";
import { csoundNodeNames as nodes } from "@kunstmusik/codemirror-lang-csound/syntax";
import { bundledSemanticSignatures } from "../../plugins/catalog";

type Options = NonNullable<Parameters<typeof analyzeCsoundSemanticLine>[1]>;
type Signatures = NonNullable<Options["userOpcodeSignatures"]>;
let cached:
    | { document: string; supplied?: Signatures; signatures: Signatures }
    | undefined;

/** Match the language package's rate notation, including array dimensions. */
function rate(type: string): string {
    const name = type.trim();
    return (name[0] ?? ".") + (name.match(/(?:\[\])+$/)?.[0] ?? "");
}

/** Keep document UDOs available before the first background check completes. */
function signaturesFor(document: string, supplied?: Signatures): Signatures {
    if (cached?.document === document && cached.supplied === supplied)
        return cached.signatures;
    const local: Signatures = new Map();
    const language = /<CsoundSynthesizer\b/i.test(document)
        ? csoundCsdLanguage
        : csoundOrcLanguage;
    language.parser.parse(document).iterate({
        enter(node) {
            if (node.name !== nodes.UdoName || !node.node.parent) return;
            const header = node.node.parent;
            const text = (from: number, to: number) => document.slice(from, to);
            const legacy = header.getChildren(nodes.UdoArgTypes);
            const inputs = header
                .getChild(nodes.ModernUdoInputs)
                ?.getChild(nodes.UdoParamList);
            const outputs = header.getChild(nodes.UdoReturnSpec);
            let signature = { inTypes: "*", outTypes: "*" };
            if (legacy.length === 2) {
                signature = {
                    outTypes: text(legacy[0].from, legacy[0].to).trim(),
                    inTypes: text(legacy[1].from, legacy[1].to).trim()
                };
            } else if (outputs) {
                const result = text(outputs.from, outputs.to).trim();
                signature = {
                    outTypes:
                        result === "void"
                            ? "(null)"
                            : result
                                  .replace(/^\(|\)$/g, "")
                                  .split(",")
                                  .map(rate)
                                  .join(""),
                    inTypes: (inputs?.getChildren(nodes.UdoParam) ?? [])
                        .map((param) =>
                            rate(text(param.from, param.to).split(":").at(-1)!)
                        )
                        .join("")
                };
            }
            const name = text(node.from, node.to);
            const overloads = local.get(name) ?? [];
            if (
                !overloads.some(
                    (item) =>
                        item.inTypes === signature.inTypes &&
                        item.outTypes === signature.outTypes
                )
            )
                overloads.push(signature);
            local.set(name, overloads);
        }
    });
    // Confirmed project signatures take precedence; local names shadow bundles.
    const signatures = new Map([
        ...bundledSemanticSignatures,
        ...local,
        ...(supplied ?? [])
    ]);
    cached = { document, supplied, signatures };
    return signatures;
}

/** Analyze a whole line once, including nested plugin and UDO calls. */
export function analyzeEditorLine(text: string, options?: Options) {
    return analyzeCsoundSemanticLine(text, {
        ...options,
        userOpcodeSignatures: signaturesFor(
            options?.documentText ?? text,
            options?.userOpcodeSignatures
        )
    });
}
