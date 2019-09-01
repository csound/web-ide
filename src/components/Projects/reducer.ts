import {
    IProjectsReducer,
    DOCUMENT_UPDATE_VALUE,
    DOCUMENT_NEW,
    SET_PROJECT
} from "./types";

const initialProjectsState: IProjectsReducer = {
    activeProject: null
};

export default (
    state: IProjectsReducer = initialProjectsState,
    action: any
) => {
    switch (action.type) {
        case SET_PROJECT: {
            return { ...state, project: action.project };
        }
        // FIXME - Below actions need to be revised for firestore integration
        case DOCUMENT_UPDATE_VALUE: {
            if (
                !action.documentUid ||
                !action.projectUid ||
                state.activeProject == null
            ) {
                return state;
            }
            state.activeProject.documents[action.documentUid].currentValue =
                action.val;
            return { ...state };
        }
        case DOCUMENT_NEW: {
            if (state.activeProject == null) {
                return state;
            }
            state.activeProject.documents = {
                ...state.activeProject.documents,
                [action.documentUid]: {
                    currentValue: action.val,
                    documentUid: action.documentUid,
                    lastEdit: null,
                    filename: action.name,
                    savedValue: action.val,
                    type: "orc"
                }
            };
            return { ...state };
        }
        default: {
            return state;
        }
    }
};
