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
    SET_PROJECT_PUBLIC,
    STORE_PROJECT_LOCALLY,
    STORE_PROJECT_STARS,
    UNSET_PROJECT
} from "./types";
import { UPDATE_PROJECT_LAST_MODIFIED_LOCALLY } from "@comp/project-last-modified/types";
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
    pipe,
    reduce
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
            (st) =>
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

const ProjectsReducer = (
    state: IProjectsReducer | undefined,
    action: Record<string, any>
): IProjectsReducer => {
    if (!state) {
        return initialProjectsState;
    } else {
        switch (action.type) {
            case STORE_PROJECT_LOCALLY: {
                if (isEmpty(action.projects)) {
                    return state;
                }

                const newState = reduce(
                    (st, proj) => {
                        const path = ["projects", proj.projectUid];
                        return hasPath(path, st)
                            ? assocPath(
                                  path,
                                  mergeAll([
                                      pathOr({}, path, st),
                                      pipe(
                                          dissoc("tags"),
                                          dissoc("stars"),
                                          dissoc("documents")
                                      )(proj)
                                  ]),
                                  st
                              )
                            : assocPath(path, proj, st);
                    },
                    state,
                    action.projects
                );
                return newState;
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
                return dissoc("activeProjectUid", state);
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
                return assocPath(
                    path,
                    action.document
                )(state) as IProjectsReducer;
            }
            case DOCUMENT_UPDATE_VALUE: {
                return !action.documentUid || !action.projectUid || !state
                    ? state
                    : (pipe(
                          assocPath(
                              [
                                  "projects",
                                  action.projectUid,
                                  "documents",
                                  action.documentUid,
                                  "isModifiedLocally"
                              ],
                              action.val !==
                                  state.projects[action.projectUid].documents[
                                      action.documentUid
                                  ].savedValue
                          ),
                          assocPath(
                              [
                                  "projects",
                                  action.projectUid,
                                  "documents",
                                  action.documentUid,
                                  "currentValue"
                              ],
                              action.val
                          )
                      )(state) as IProjectsReducer);
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
                return assocPath(
                    [
                        "projects",
                        state.activeProjectUid,
                        "documents",
                        action.documentUid,
                        "filename"
                    ],
                    action.newFilename
                )(state);
            }
            case UPDATE_PROJECT_LAST_MODIFIED_LOCALLY: {
                return state &&
                    action.projectUid !== null &&
                    action.projectUid === state.activeProjectUid
                    ? (assocPath as any)(
                          [
                              "projects",
                              state.activeProjectUid,
                              "cachedProjectLastModified"
                          ],
                          action.timestamp,
                          state as IProjectsReducer
                      )
                    : state;
            }
            default: {
                return (state as IProjectsReducer) || initialProjectsState;
            }
        }
    }
};

export default ProjectsReducer;
