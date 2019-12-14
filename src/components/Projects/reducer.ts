import {
    IDocument,
    IProjectsReducer,
    IProject,
    ACTIVATE_PROJECT,
    DOCUMENT_INITIALIZE,
    DOCUMENT_RESET,
    DOCUMENT_RENAME_LOCALLY,
    DOCUMENT_SAVE,
    DOCUMENT_UPDATE_VALUE,
    DOCUMENT_UPDATE_MODIFIED_LOCALLY,
    CLOSE_PROJECT,
    SET_PROJECT,
    SET_PROJECT_FILES,
    SET_PROJECT_TARGETS
} from "./types";
import { assoc, assocPath, append, curry, pathOr, pipe } from "ramda";
import { isEmpty } from "lodash";

type IProjectMap = { [projectUid: string]: IProject };

const initialProjectsState: IProjectsReducer = {
    activeProjectUid: null,
    projects: {} as IProjectMap
};

const generateEmptyDocument = (documentUid, type, filename): IDocument => ({
    filename,
    currentValue: "",
    documentUid,
    savedValue: "",
    type,
    isModifiedLocally: false
});

const resetDocumentToSavedValue = curry((action, state) =>
    pipe(
        assocPath(
            [
                "projects",
                state.activeProjectUid,
                "documents",
                action.documentUid,
                "currentValue"
            ],
            pathOr("", [
                "projects",
                state.activeProjectUid,
                "documents",
                action.documentUid,
                "savedValue"
            ])
        ),
        assocPath(
            [
                "projects",
                state.activeProjectUid,
                "documents",
                action.documentUid,
                "isModifiedLocally"
            ],
            false
        )
    )(state)
);

export default (state: IProjectsReducer, action: any) => {
    switch (action.type) {
        case SET_PROJECT: {
            return isEmpty(action.project)
                ? state
                : assocPath(
                      ["projects", action.project.projectUid],
                      action.project,
                      state
                  );
        }
        case SET_PROJECT_FILES: {
            return assocPath(
                ["projects", action.projectUid, "documents"],
                action.files,
                state
            );
        }
        case SET_PROJECT_TARGETS: {
            return assocPath(
                ["projects", action.projectUid, "targets"],
                action.targets,
                state
            );
        }
        case ACTIVATE_PROJECT:
            return assoc("activeProjectUid", action.projectUid, state);
        case CLOSE_PROJECT: {
            return assoc("activeProjectUid", null, state);
        }
        case DOCUMENT_INITIALIZE: {
            // const oldDocuments = cloneDeep(state.activeProject.documents);
            const newDocument = generateEmptyDocument(
                action.documentUid,
                action.type,
                action.filename
            );
            return assocPath(
                ["documents", action.projectUid, "documents"],
                append(
                    newDocument,
                    pathOr(
                        [],
                        ["documents", action.projectUid, "documents"],
                        state
                    )
                ),
                state
            );
        }
        case DOCUMENT_RESET: {
            return resetDocumentToSavedValue(action, state);
        }
        case DOCUMENT_SAVE: {
            if (
                !action.documentUid ||
                !action.projectUid ||
                state.activeProjectUid === null
            ) {
                return state;
            } else {
                return resetDocumentToSavedValue(action, state);
            }
        }
        case DOCUMENT_UPDATE_VALUE: {
            if (
                !action.documentUid ||
                !action.projectUid ||
                state.activeProjectUid === null
            ) {
                return state;
            }

            return assocPath(
                [
                    "projects",
                    action.projectUid,
                    "documents",
                    action.documentUid,
                    "currentValue"
                ],
                action.val,
                state
            );
        }
        case DOCUMENT_UPDATE_MODIFIED_LOCALLY: {
            if (!action.documentUid || state.activeProjectUid == null) {
                return state;
            }
            return assocPath(
                [
                    "projects",
                    state.activeProjectUid,
                    "documents",
                    action.documentUid,
                    "isModifiedLocally"
                ],
                action.isModified,
                state
            );
        }
        case DOCUMENT_RENAME_LOCALLY: {
            return assocPath(
                [
                    "projects",
                    state.activeProjectUid,
                    "documents",
                    action.documentUid,
                    "filename"
                ],
                action.newFilename,
                state
            );
        }
        default: {
            return (state as IProjectsReducer) || initialProjectsState;
        }
    }
};
