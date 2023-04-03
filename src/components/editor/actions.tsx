import { EditorView } from "@codemirror/view";
import { RootState, store } from "@root/store";

export const toggleEditorFullScreen = (): void => {
    const storeState = store.getState() as RootState;
    const session = storeState.ProjectEditorReducer;
    const tabIndex = session.tabDock.tabIndex;
    const editorInstance =
        session.tabDock.openDocuments[tabIndex].editorInstance;
    editorInstance.display.wrapper.requestFullscreen();
};

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
