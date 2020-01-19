import {
    IProjectsReducer,
    IProject,
    ACTIVATE_PROJECT,
    ADD_PROJECT_DOCUMENTS,
    DOCUMENT_INITIALIZE,
    DOCUMENT_RESET,
    DOCUMENT_RENAME_LOCALLY,
    DOCUMENT_REMOVE_LOCALLY,
    DOCUMENT_SAVE,
    DOCUMENT_UPDATE_VALUE,
    DOCUMENT_UPDATE_MODIFIED_LOCALLY,
    CLOSE_PROJECT,
    SET_PROJECT,
    SET_PROJECT_PUBLIC
} from "./types";
import { generateEmptyDocument } from "./utils";
import { UPDATE_TARGETS_LOCALLY } from "@comp/TargetControls/types";
import {
    assoc,
    assocPath,
    curry,
    dissocPath,
    mergeAll,
    pathOr,
    pipe
} from "ramda";
import { isEmpty } from "lodash";

type IProjectMap = { [projectUid: string]: IProject };

const initialProjectsState: IProjectsReducer = {
    activeProjectUid: "",
    projects: {} as IProjectMap
};

const resetDocumentToSavedValue = curry(
    (state: IProjectsReducer, activeProjectUid: string, documentUid: string) =>
        pipe(
            st =>
                assocPath(
                    [
                        "projects",
                        activeProjectUid,
                        "documents",
                        documentUid,
                        "currentValue"
                    ],
                    pathOr(
                        "",
                        [
                            "projects",
                            activeProjectUid,
                            "documents",
                            documentUid,
                            "savedValue"
                        ],
                        st
                    ),
                    st
                ),
            assocPath(
                [
                    "projects",
                    activeProjectUid,
                    "documents",
                    documentUid,
                    "isModifiedLocally"
                ],
                false
            )
        )(state)
);

export default (state: IProjectsReducer | undefined, action: any) => {
    switch (action.type) {
        case SET_PROJECT: {
            return isEmpty(action.project)
                ? state
                : (assocPath(
                      ["projects", action.project.projectUid],
                      action.project
                  )(state as IProjectsReducer) as IProjectsReducer);
        }
        case ADD_PROJECT_DOCUMENTS: {
            const path = ["projects", action.projectUid, "documents"];
            return assocPath(
                path,
                mergeAll([pathOr({}, path, state), action.documents])
            )(state) as IProjectsReducer;
        }
        case SET_PROJECT_PUBLIC: {
            return assocPath(
                ["projects", action.projectUid, "isPublic"],
                action.isPublic
            )(state) as IProjectsReducer;
        }
        case ACTIVATE_PROJECT:
            return assoc("activeProjectUid", action.projectUid, state);
        case CLOSE_PROJECT: {
            return assoc("activeProjectUid", null, state);
        }

        case DOCUMENT_INITIALIZE: {
            const newDocument = generateEmptyDocument(
                action.documentUid,
                action.filename
            );
            return assocPath(
                [
                    "projects",
                    action.projectUid,
                    "documents",
                    action.documentUid
                ],
                newDocument
            )(state) as IProjectsReducer;
        }
        case DOCUMENT_REMOVE_LOCALLY: {
            return dissocPath([
                "projects",
                action.projectUid,
                "documents",
                action.documentUid
            ])(state);
        }
        case DOCUMENT_RESET: {
            return state
                ? resetDocumentToSavedValue(
                      state,
                      action.projectUid,
                      action.documentUid
                  )
                : state;
        }
        case DOCUMENT_SAVE: {
            const path = [
                "projects",
                action.projectUid,
                "documents",
                action.document.documentUid
            ];
            return assocPath(path, action.document)(state) as IProjectsReducer;
            // return pipe(
            //     assocPath(
            //         [
            //             "projects",
            //             action.projectUid,
            //             "documents",
            //             action.documentUid,
            //             "currentValue"
            //         ],
            //         action.currentValue
            //     ),
            //     assocPath(
            //         [
            //             "projects",
            //             action.projectUid,
            //             "documents",
            //             action.documentUid,
            //             "savedValue"
            //         ],
            //         action.currentValue
            //     ),
            //     assocPath(
            //         [
            //             "projects",
            //             action.projectUid,
            //             "documents",
            //             action.documentUid,
            //             "isModifiedLocally"
            //         ],
            //         false
            //     )
            // )(state);
        }
        case DOCUMENT_UPDATE_VALUE: {
            if (!action.documentUid || !action.projectUid || !state) {
                return state;
            } else {
                return assocPath(
                    [
                        "projects",
                        action.projectUid,
                        "documents",
                        action.documentUid,
                        "currentValue"
                    ],
                    action.val
                )(state) as IProjectsReducer;
            }
        }
        case DOCUMENT_UPDATE_MODIFIED_LOCALLY: {
            if (!action.documentUid || !state) {
                return state;
            }
            return assocPath(
                [
                    "projects",
                    action.projectUid,
                    "documents",
                    action.documentUid,
                    "isModifiedLocally"
                ],
                action.isModified
            )(state) as IProjectsReducer;
        }
        case DOCUMENT_RENAME_LOCALLY: {
            return (
                (state &&
                    (assocPath(
                        [
                            "projects",
                            state.activeProjectUid,
                            "documents",
                            action.documentUid,
                            "filename"
                        ],
                        action.newFilename
                    )(state) as IProjectsReducer)) ||
                state
            );
        }
        case UPDATE_TARGETS_LOCALLY: {
            return pipe(
                assocPath(
                    ["projects", action.projectUid, "targets"],
                    action.targets
                ),
                assocPath(
                    ["projects", action.projectUid, "defaultTarget"],
                    action.defaultTarget
                )
            )(state);
        }
        default: {
            return (state as IProjectsReducer) || initialProjectsState;
        }
    }
};
