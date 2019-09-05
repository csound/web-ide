import {
    IProjectsReducer,
    IProject,
    DOCUMENT_RESET,
    DOCUMENT_SAVE,
    DOCUMENT_UPDATE_VALUE,
    DOCUMENT_UPDATE_MODIFIED_LOCALLY,
    SET_PROJECT
} from "./types";

const initialProjectsState: IProjectsReducer = {
    activeProject: null
};

export default (state, action: any) => {
    switch (action.type) {
        case SET_PROJECT: {
            if (action.project as IProject) {
                state.activeProject = action.project;
                return { ...state };
            } else {
                return state;
            }
        }
        case DOCUMENT_RESET: {
            state.activeProject.documents[action.documentUid].currentValue =
                state.activeProject.documents[action.documentUid].savedValue;
            state.activeProject.documents[
                action.documentUid
            ].isModifiedLocally = false;
            return { ...state };
        }
        case DOCUMENT_SAVE: {
            if (
                !action.documentUid ||
                !action.projectUid ||
                state.activeProject === null
            ) {
                return state;
            }
            state.activeProject.documents[action.documentUid].savedValue =
                action.currentValue;
            state.activeProject.documents[
                action.documentUid
            ].isModifiedLocally = false;
            return { ...state };
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
            return (state as IProjectsReducer) || initialProjectsState;
        }
    }
};
