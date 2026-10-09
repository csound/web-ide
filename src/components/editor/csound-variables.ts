import type { Completion } from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";
import type { EditorState } from "@codemirror/state";
import type { SyntaxNode } from "@lezer/common";

const scopes = new Set([
    "InstrumentDefinition",
    "OpcodeDefinition",
    "UdoDefinition"
]);
function scopeAt(node: SyntaxNode | null): SyntaxNode | null {
    for (; node; node = node.parent) if (scopes.has(node.name)) return node;
    return null;
}

/** Use the tolerant editor tree so completion still works in unfinished code. */
export function csoundVariables(
    state: EditorState,
    position: number
): Completion[] {
    const tree = syntaxTree(state);
    const scope = scopeAt(tree.resolveInner(position, -1));
    const options = new Map<string, Completion>();
    const add = (text: string, node: SyntaxNode) => {
        const declaration =
            /^([\p{L}_][\p{L}\p{N}_]*)(?:@global)?(?::([\w]+)(?:\[\])*)?$/u.exec(
                text
            );
        if (!declaration) return;
        const [, label, explicitType] = declaration;
        const global =
            text.includes("@global") ||
            (!explicitType && /^g[akiSf]/.test(label));
        const owner = scopeAt(node);
        if (!global && (owner?.from !== scope?.from || owner?.to !== scope?.to))
            return;
        if (node.from >= position && !global) return;
        options.set(label, {
            label,
            type: "variable",
            detail:
                explicitType || (global ? "Global variable" : "Local variable"),
            boost: 30
        });
    };
    tree.iterate({
        enter(node) {
            if (node.name === "AssignmentTargetAtom") {
                add(
                    state.sliceDoc(node.from, node.to).replace(/\[.*$/, ""),
                    node.node
                );
                return false;
            }
            if (node.name === "OrcGenericLine") {
                // Classic syntax has output variables before its opcode. Only take
                // the leading output list, never argument uses or comments.
                const text = state.sliceDoc(node.from, node.to);
                const outputs =
                    /^((?:(?:g?[akiSf][\p{L}\p{N}_]*|[\p{L}_][\p{L}\p{N}_]*:[\w]+)(?:\[\])?\s*,\s*)*(?:g?[akiSf][\p{L}\p{N}_]*|[\p{L}_][\p{L}\p{N}_]*:[\w]+)(?:\[\])?)\s+[\p{L}_][\p{L}\p{N}_]*\b/u.exec(
                        text
                    )?.[1];
                outputs
                    ?.split(",")
                    .forEach((output) =>
                        add(output.trim().replace(/\[\]$/, ""), node.node)
                    );
                return false;
            }
        }
    });
    return [...options.values()];
}
