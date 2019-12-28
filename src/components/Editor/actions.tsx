import { store } from "../../store";
import { IStore } from "@store/types";

export const toggleEditorFullScreen = (): void => {
    const storeState = store.getState() as IStore;
    const session = storeState.ProjectEditorReducer;
    const tabIndex = session.tabDock.tabIndex;
    const editorInstance =
        session.tabDock.openDocuments[tabIndex].editorInstance;
    editorInstance.display.wrapper.requestFullscreen();
};
