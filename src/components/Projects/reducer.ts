import {
    IProjectsReducer,
    DOCUMENT_UPDATE_VALUE,
    DOCUMENT_UPDATE_MODIFIED_LOCALLY,
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
            return { ...state, activeProject: action.project };
        }
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
        case DOCUMENT_UPDATE_MODIFIED_LOCALLY: {
            if (!action.documentUid || state.activeProject == null) {
                return state;
            }
            state.activeProject.documents[action.documentUid] = {
                ...state.activeProject.documents[action.documentUid],
                isModifiedLocally: action.isModified
            };
            return { ...state };
        }
        default: {
            return state;
        }
    }
};
