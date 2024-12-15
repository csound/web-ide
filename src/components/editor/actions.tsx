import { EditorView } from "@codemirror/view";

export const manualEntryAtPoint = (editorReference: EditorView) => {
    return async (): Promise<void> => {
        console.log("FIXME", editorReference);
        // if (!editorReference || !window.csoundSynopsis) {
        //     return;
        // }
        // const cursor = editorReference.getCursor();
        // const token = editorReference
        //     .getTokenAt(cursor)
        //     .string.replace(/:.*/, "");
        // const manualEntry = window.csoundSynopsis.find(
        //     (opc) => opc.opname === token
        // );
        // if (manualEntry) {
        //     dispatch(lookupManualString());
        //     setTimeout(() => dispatch(lookupManualString(manualEntry.id)), 10);
        // }
    };
};
