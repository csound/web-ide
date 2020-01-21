import synopsis from "csound-manual-react/lib/manual/synopsis";
import { store } from "@root/store";
import { IStore } from "@store/types";
import { lookupManualString } from "../ProjectEditor/actions";
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

export const docAtPoint = editorRef => {
    return async (dispatch: any) => {
        if (!editorRef) return;
        const cursor = editorRef.getCursor();
        const token = editorRef.getTokenAt(cursor).string.replace(/:.*/, "");
        if (opcodes.some(opc => opc === token)) {
            const manualId = synopsis[token]["id"];
            dispatch(lookupManualString(null));
            setTimeout(() => dispatch(lookupManualString(manualId)), 10);
        }
    };
};
