import { ISession } from "./interfaces";
import { initialProjectUid, initialDocumentUids } from "../Projects/reducer";
import { findIndex, filter } from "lodash";

export interface ILayoutReducer {
    sessions: ISession[];
};

const initialLayoutState: ILayoutReducer = {
    sessions: [{
        projectUid: initialProjectUid,
        tabDock: {
            tabIndex: 0,
            openDocuments: initialDocumentUids.map(uid => ({uid, editorInstance: null})),
        }
    }]
}

export default (state: ILayoutReducer, action: any) => {
    switch (action.type) {
        case "TAB_DOCK_SWITCH_TAB": {
            const sessionIndex = findIndex(state.sessions, s => s.projectUid === action.projectUid);
            state.sessions[sessionIndex].tabDock.tabIndex = action.tabIndex;
            return {...state};
        }
        case "TAB_CLOSE": {
            const sessionIndex = findIndex(state.sessions, s => s.projectUid === action.projectUid);
            const currentTabIndex = state.sessions[sessionIndex].tabDock.tabIndex;
            state.sessions[sessionIndex].tabDock.tabIndex =
                Math.min(currentTabIndex, state.sessions[sessionIndex].tabDock.openDocuments.length - 2 );
            state.sessions[sessionIndex].tabDock.openDocuments =
                filter(state.sessions[sessionIndex].tabDock.openDocuments, od => od.uid !== action.documentUid);
            return {...state};
        }
        case "STORE_EDITOR_INSTANCE": {
            const sessionIndex = findIndex(state.sessions, s => s.projectUid === action.projectUid);
            const openDocumentIndex = findIndex(state.sessions[sessionIndex].tabDock.openDocuments,
                                                od => od.uid === action.documentUid);
            if (openDocumentIndex < 0) {
                return state;
            }
            state.sessions[sessionIndex].tabDock.openDocuments[openDocumentIndex].editorInstance = action.editorInstance;
            return {...state};
        }
        default: {
            return state || initialLayoutState;
        }
    }
}
