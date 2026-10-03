import { EditorView } from "@codemirror/view";
import { lookupManualString } from "@comp/project-editor/actions";
import { AppDispatch } from "@root/store";

/** Look up the word at the CodeMirror cursor in the manual dock. */
export const manualEntryAtPoint = (editorReference: EditorView) => {
    return (dispatch: AppDispatch): void => {
        const { state } = editorReference;
        const word = state.wordAt(state.selection.main.head);
        dispatch(
            lookupManualString(
                word ? state.sliceDoc(word.from, word.to) : undefined
            )
        );
    };
};
