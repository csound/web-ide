import { curry } from "ramda";
import { syntaxTree } from "@codemirror/language";
import { StateEffect, StateField, Transaction } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";
import type { SyntaxNode, TreeCursor } from "@lezer/common";
import type { CsoundObj } from "@comp/csound/types";

const addBlinkSuccessMarks = StateEffect.define();
const removeBlinkSuccessMarks = StateEffect.define();

const blinkSuccessMarks = Decoration.mark({
    attributes: { class: "blink-eval" }
});

const addBlinkErrorMarks = StateEffect.define();
const removeBlinkErrorMarks = StateEffect.define();

const blinkErrorMarks = Decoration.mark({
    attributes: { class: "blink-eval-error" }
});

export const evalBlinkExtension = StateField.define({
    create() {
        return Decoration.none;
    },
    update(value: DecorationSet, tr: Transaction) {
        value = value.map(tr.changes);
        for (const effect of tr.effects) {
            if (effect.is(addBlinkSuccessMarks)) {
                value = value.update({ add: effect.value, sort: true } as any);
            }
            if (effect.is(removeBlinkSuccessMarks)) {
                value = value.update({ filter: effect.value } as any);
            }

            if (effect.is(addBlinkErrorMarks)) {
                value = value.update({ add: effect.value, sort: true } as any);
            }
            if (effect.is(removeBlinkErrorMarks)) {
                value = value.update({ filter: effect.value } as any);
            }
        }
        return value;
    },
    // Indicate that this field provides a set of decorations
    provide: (f) => EditorView.decorations.from(f)
});

const evaluableBlockNames = new Set(["InstrumentDefinition", "UdoDefinition"]);

export const findSurroundingContext = (
    tree: TreeCursor
): SyntaxNode | undefined => {
    let statement: SyntaxNode | undefined;
    let node: SyntaxNode | null = tree.node;

    while (node) {
        if (evaluableBlockNames.has(node.type.name)) {
            return node;
        }

        const parentName = node.parent?.type.name;
        if (
            (node.type.name === "OrcStatement" &&
                parentName === "OrcStatements") ||
            (node.type.name === "ScoStatement" &&
                parentName === "ScoStatements")
        ) {
            statement = node;
        }

        node = node.parent;
    }

    return statement;
};

const evalSelection = async ({
    csound,
    documentType,
    evalString
}: {
    csound: CsoundObj;
    documentType: string;
    evalString: string;
}): Promise<number> => {
    switch (documentType) {
        case "orc":
        case "udo": {
            return await csound.evalCode(evalString);
        }
        case "sco": {
            return (await csound.readScore(evalString)) || 0;
        }
        case "csd": {
            return await csound.evalCode(evalString);
        }
        default: {
            console.error("document type isn't csound!");
            return -1;
        }
    }
};

export const editorEvalCode = curry(
    (
        csound,
        csoundStatus,
        documentType,
        view: EditorView,
        blockEval: boolean
    ) => {
        if (csoundStatus !== "playing") {
            return;
        }
        const userHasSelection =
            view.state.selection.main.from !== view.state.selection.main.to;

        let selection;
        let context: { from: number; to: number } | undefined;

        if (userHasSelection && !blockEval) {
            context = {
                from: view.state.selection.main.from,
                to: view.state.selection.main.to
            };
            selection = view.state.sliceDoc(context.from, context.to);
        } else if (blockEval) {
            const treeRoot = syntaxTree(view.state).cursorAt(
                view.state.selection.main.head,
                1
            );

            context = findSurroundingContext(treeRoot);

            if (
                typeof context === "object" &&
                typeof context.from === "number"
            ) {
                selection = view.state.sliceDoc(context.from, context.to);
            }
        }

        // fallback to current line if no selection
        if (!selection) {
            const line = view.state.doc.lineAt(view.state.selection.main.head);
            context = { from: line.from, to: line.to };
            selection = view.state.sliceDoc(line.from, line.to);
        }

        if (selection && context) {
            evalSelection({ csound, documentType, evalString: selection }).then(
                (result: number) => {
                    if (result === 0) {
                        view.dispatch({
                            effects: addBlinkSuccessMarks.of([
                                blinkSuccessMarks.range(
                                    context.from,
                                    context.to
                                )
                            ] as any)
                        });
                    } else {
                        view.dispatch({
                            effects: addBlinkErrorMarks.of([
                                blinkErrorMarks.range(context.from, context.to)
                            ] as any)
                        });
                    }

                    setTimeout(
                        () =>
                            result === 0
                                ? view.dispatch({
                                      effects: removeBlinkSuccessMarks.of(
                                          ((from: number, to: number) =>
                                              to <= context.from ||
                                              from >= context.to) as any
                                      )
                                  })
                                : view.dispatch({
                                      effects: removeBlinkErrorMarks.of(
                                          ((from: number, to: number) =>
                                              to <= context.from ||
                                              from >= context.to) as any
                                      )
                                  }),
                        200
                    );
                }
            );
        }
    }
);

export const uncommentLine = (line: string): string => {
    let uncommentedLine: any = line.split(";");
    if (uncommentedLine.length > 1) {
        uncommentedLine = uncommentedLine[0];
    } else {
        uncommentedLine = uncommentedLine[0].split("//");
        uncommentedLine = uncommentedLine[0];
    }
    return uncommentedLine;
};
