import { IProjectsReducer, DOCUMENT_UPDATE_VALUE, SET_PROJECT } from "./types";

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
        default: {
            return state;
        }
    }
};
