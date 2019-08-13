import { ISession } from "./interfaces";
import { initialProjectUid, initialDocumentUids } from "../Projects/reducer";
import { findIndex } from "lodash";

export interface ILayoutReducer {
    sessions: ISession[];
};

const initialLayoutState: ILayoutReducer = {
    sessions: [{
        projectUid: initialProjectUid,
        tabDock: {
            tabIndex: 0,
            openDocumentUids: initialDocumentUids,
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
        default: {
            return state || initialLayoutState;
        }
    }
}
