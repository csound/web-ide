import { EditorView } from "codemirror";
import { store } from "@root/store";
import { IStore } from "@store/types";
// import { lookupManualString } from "../project-editor/actions";

export const toggleEditorFullScreen = (): void => {
    const storeState = store.getState() as IStore;
    const session = storeState.ProjectEditorReducer;
    const tabIndex = session.tabDock.tabIndex;
    const editorInstance =
        session.tabDock.openDocuments[tabIndex].editorInstance;
    editorInstance.display.wrapper.requestFullscreen();
};

export const manualEntryAtPoint = (editorReference: EditorView) => {
    return async (dispatch: (any) => void): Promise<void> => {
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
