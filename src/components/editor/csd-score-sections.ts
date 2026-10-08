import { StateField, type EditorState, type Text } from "@codemirror/state";
import { scoreNotation, scoreSections } from "../csound/score-source";

function readSections(doc: Text) {
    const source = doc.toString();
    return {
        source,
        external: scoreSections(source).filter((section) =>
            scoreNotation(section.command)
        )
    };
}

/** Installed only in CSD mode. All editor consumers share one scan per document version. */
export const csdScoreSections = StateField.define({
    create: (state) => readSections(state.doc),
    update: (sections, transaction) =>
        transaction.docChanged ? readSections(transaction.newDoc) : sections
});

export function inExternalScore(state: EditorState, position: number): boolean {
    return (
        state
            .field(csdScoreSections, false)
            ?.external.some(
                (section) =>
                    position >= section.bodyFrom && position <= section.bodyTo
            ) ?? false
    );
}
