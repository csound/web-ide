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
    SET_PROJECT_PUBLIC,
    STORE_PROJECT_STARS,
    UNSET_PROJECT
} from "./types";
import { UPDATE_PROJECT_LAST_MODIFIED_LOCALLY } from "@comp/ProjectLastModified/types";
import { generateEmptyDocument } from "./utils";
import {
    assoc,
    assocPath,
    curry,
    dissoc,
    dissocPath,
    mergeAll,
    hasPath,
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
            if (isEmpty(action.project)) {
                return state;
            }
            const path = ["projects", action.project.projectUid];
            if (hasPath(path, state)) {
                return assocPath(
                    path,
                    mergeAll([
                        pathOr({}, path, state),
                        pipe(dissoc("tags"), dissoc("stars"))(action.project)
                    ])
                )(state as IProjectsReducer) as IProjectsReducer;
            } else {
                return assocPath(path, action.project, state);
            }
        }
        case UNSET_PROJECT: {
            return dissocPath(["projects", action.projectUid], state);
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
        case STORE_PROJECT_STARS: {
            return assocPath(
                ["projects", action.projectUid, "stars"],
                action.stars,
                state
            );
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
        case UPDATE_PROJECT_LAST_MODIFIED_LOCALLY: {
            if (
                state &&
                action.projectUid !== null &&
                action.projectUid === state.activeProjectUid
            ) {
                return (assocPath as any)(
                    [
                        "projects",
                        state.activeProjectUid,
                        "cachedProjectLastModified"
                    ],
                    action.timestamp,
                    state as IProjectsReducer
                );
            } else {
                return state;
            }
        }
        default: {
            return (state as IProjectsReducer) || initialProjectsState;
        }
    }
};
