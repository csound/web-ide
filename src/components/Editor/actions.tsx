import { store } from "../../store";
import { IStore } from "../../db/interfaces";

export const toggleEditorFullScreen = (): void => {
    const storeState = store.getState() as IStore;
    const activeProjectUid = storeState.ProjectsReducer.activeProjectUid;
    const session = storeState.LayoutReducer.sessions[activeProjectUid];
    const tabIndex = session.tabDock.tabIndex;
    const editorInstance =
        session.tabDock.openDocuments[tabIndex].editorInstance;
    editorInstance.display.wrapper.requestFullscreen();
};
