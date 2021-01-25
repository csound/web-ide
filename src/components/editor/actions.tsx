import CodeMirror from "codemirror";
import synopsis from "csound-manual-react/lib/manual/synopsis";
import { store } from "@root/store";
import { IStore } from "@store/types";
import { lookupManualString } from "../project-editor/actions";
import { keys } from "ramda";

const opcodes = keys(synopsis);

export const toggleEditorFullScreen = (): void => {
    const storeState = store.getState() as IStore;
    const session = storeState.ProjectEditorReducer;
    const tabIndex = session.tabDock.tabIndex;
    const editorInstance =
        session.tabDock.openDocuments[tabIndex].editorInstance;
    editorInstance.display.wrapper.requestFullscreen();
};

export const manualEntryAtPoint = (editorReference: CodeMirror.Editor) => {
    return async (dispatch: (any) => void): Promise<void> => {
        if (!editorReference) {
            return;
        }
        const cursor = editorReference.getCursor();
        const token = editorReference
            .getTokenAt(cursor)
            .string.replace(/:.*/, "");
        if (opcodes.some((opc) => opc === token)) {
            const manualId = synopsis[token]["id"];
            dispatch(lookupManualString());
            setTimeout(() => dispatch(lookupManualString(manualId)), 10);
        }
    };
};
