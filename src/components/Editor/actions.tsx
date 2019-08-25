import { store } from "../../store";

export const toggleEditorFullScreen = (): void => {
    const storeState = store.getState();
    const activeProjectUid = storeState.ProjectsReducer.activeProjectUid;
    const session = storeState.LayoutReducer.sessions[activeProjectUid];
    const tabIndex = session.tabDock.tabIndex;
    const editorInstance = session.tabDock.openDocuments[tabIndex].editorInstance;
    editorInstance.display.wrapper.requestFullscreen()
}
