import { ISession } from "./interfaces";
import { initialProjectUid, initialDocumentUids } from "../Projects/reducer";
import { filter, find, findIndex } from "lodash";

export interface ILayoutReducer {
    sessions: { [projectId: string]: ISession };
}

const initialLayoutState: ILayoutReducer = {
    sessions: {
        [initialProjectUid]: {
            projectUid: initialProjectUid,
            tabDock: {
                tabIndex: 0,
                openDocuments: initialDocumentUids.map(uid => ({
                    uid,
                    editorInstance: null
                }))
            }
        }
    }
};

export default (state: ILayoutReducer = initialLayoutState, action: any) => {
    switch (action.type) {
        case "TAB_DOCK_SWITCH_TAB": {
            state.sessions[action.projectUid].tabDock.tabIndex =
                action.tabIndex;
            return { ...state };
        }
        case "TAB_DOCK_OPEN_TAB_BY_DOCUMENT_UID": {
            const currentOpenDocs =
                state.sessions[action.projectUid].tabDock.openDocuments;
            const documentAlreadyOpenIndex = findIndex(
                currentOpenDocs,
                od => od.uid === action.documentUid
            );
            if (documentAlreadyOpenIndex < 0) {
                state.sessions[action.projectUid].tabDock.tabIndex =
                    currentOpenDocs.length;
                currentOpenDocs.push({
                    uid: action.documentUid,
                    editorInstance: null
                });
            } else {
                state.sessions[
                    action.projectUid
                ].tabDock.tabIndex = documentAlreadyOpenIndex;
            }
            return { ...state };
        }
        case "TAB_CLOSE": {
            const currentTabIndex =
                state.sessions[action.projectUid].tabDock.tabIndex;
            state.sessions[action.projectUid].tabDock.tabIndex = Math.min(
                currentTabIndex,
                state.sessions[action.projectUid].tabDock.openDocuments.length -
                    2
            );
            state.sessions[action.projectUid].tabDock.openDocuments = filter(
                state.sessions[action.projectUid].tabDock.openDocuments,
                od => od.uid !== action.documentUid
            );
            return { ...state };
        }
        case "STORE_EDITOR_INSTANCE": {
            const openDocument = find(
                state.sessions[action.projectUid].tabDock.openDocuments,
                od => od.uid === action.documentUid
            );

            if (!openDocument) {
                return state;
            }
            openDocument.editorInstance = action.editorInstance;
            return { ...state };
        }
        default: {
            return state || initialLayoutState;
        }
    }
};
