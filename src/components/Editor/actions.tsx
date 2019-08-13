import { store } from "../../store";
import { findIndex } from "lodash";

export const toggleEditorFullScreen = (): void => {
    const storeState = store.getState();
    const activeProjectUid = storeState.ProjectsReducer.activeProjectUid;
    const sessionIndex = findIndex(storeState.LayoutReducer.sessions, s => s.projectUid === activeProjectUid);
    const session = storeState.LayoutReducer.sessions[sessionIndex];
    const tabIndex = session.tabDock.tabIndex;
    const editorInstance = storeState.LayoutReducer.sessions[sessionIndex].tabDock.openDocuments[tabIndex].editorInstance;
    editorInstance.display.wrapper.requestFullscreen()
}
