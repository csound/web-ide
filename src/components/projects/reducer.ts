import { RootState } from "@root/store";
import * as ProjectsTypes from "./types";
import { generateEmptyDocument } from "./utils";

type IProjectMap = { [projectUid: string]: ProjectsTypes.IProject };

const initialProjectsState: ProjectsTypes.IProjectsReducer = {
    activeProjectUid: "",
    projects: {} as IProjectMap
};

const resetDocumentToSavedValue = (
    state: ProjectsTypes.IProjectsReducer,
    activeProjectUid: string,
    documentUid: string
) => {
    const savedValue =
        state?.projects?.[activeProjectUid]?.documents?.[documentUid]
            ?.savedValue || "";

    return {
        ...state,
        projects: {
            ...state.projects,
            [activeProjectUid]: {
                ...state.projects[activeProjectUid],
                documents: {
                    ...state.projects[activeProjectUid].documents,
                    [documentUid]: {
                        ...state.projects[activeProjectUid].documents[
                            documentUid
                        ],
                        currentValue: savedValue,
                        isModifiedLocally: false
                    }
                }
            }
        }
    };
};

export const ProjectsReducer = (
    state: ProjectsTypes.IProjectsReducer = initialProjectsState,
    unknownAction: ProjectsTypes.ProjectsActionTypes
): ProjectsTypes.IProjectsReducer => {
    switch (unknownAction.type) {
        case ProjectsTypes.STORE_PROJECT_LOCALLY: {
            const action =
                unknownAction as ProjectsTypes.StoreProjectLocallyAction;
            if (!action.projects || action.projects.length === 0) {
                return state;
            }

            const newState = action.projects.reduce((st, proj) => {
                const existingProject = st.projects?.[proj.projectUid] || {};

                return st.projects?.[proj.projectUid]
                    ? {
                          ...st,
                          projects: {
                              ...st.projects,
                              [proj.projectUid]: {
                                  ...existingProject,
                                  ...Object.entries(proj).reduce(
                                      (acc: any, [key, value]) => {
                                          if (
                                              ![
                                                  "tags",
                                                  "stars",
                                                  "documents"
                                              ].includes(key)
                                          ) {
                                              acc[key] = value;
                                          }
                                          return acc;
                                      },
                                      {}
                                  )
                              }
                          }
                      }
                    : {
                          ...st,
                          projects: {
                              ...st.projects,
                              [proj.projectUid]: proj
                          }
                      };
            }, state);

            return newState;
        }

        case ProjectsTypes.UNSET_PROJECT: {
            const action = unknownAction as ProjectsTypes.UnsetProjectAction;
            const {
                [action.projectUid]: removedProject,
                ...remainingProjects
            } = state.projects;
            return {
                ...state,
                projects: remainingProjects
            };
        }

        case ProjectsTypes.ADD_PROJECT_DOCUMENTS: {
            const action =
                unknownAction as ProjectsTypes.AddProjectDocumentsAction;
            return {
                ...state,
                projects: {
                    ...state.projects,
                    [action.projectUid]: {
                        ...state.projects[action.projectUid],
                        documents: {
                            ...state.projects[action.projectUid].documents,
                            ...action.documents
                        }
                    }
                }
            };
        }

        case ProjectsTypes.SET_PROJECT_PUBLIC: {
            const action =
                unknownAction as ProjectsTypes.SetProjectPublicAction;
            return {
                ...state,
                projects: {
                    ...state.projects,
                    [action.projectUid]: {
                        ...state.projects[action.projectUid],
                        isPublic: action.isPublic
                    }
                }
            };
        }

        case ProjectsTypes.ACTIVATE_PROJECT: {
            const action = unknownAction as ProjectsTypes.ActivateProjectAction;
            return { ...state, activeProjectUid: action.projectUid };
        }

        case ProjectsTypes.CLOSE_PROJECT: {
            const action = unknownAction as ProjectsTypes.CloseProjectAction;
            const { activeProjectUid, ...remainingState } = state;
            return remainingState;
        }

        case ProjectsTypes.STORE_PROJECT_STARS: {
            const action =
                unknownAction as ProjectsTypes.StoreProjectStarsAction;
            return {
                ...state,
                projects: {
                    ...state.projects,
                    [action.projectUid]: {
                        ...state.projects[action.projectUid],
                        stars: action.stars
                    }
                }
            };
        }

        case ProjectsTypes.DOCUMENT_INITIALIZE: {
            const action =
                unknownAction as ProjectsTypes.DocumentInitializeAction;
            const newDocument = generateEmptyDocument(
                action.documentUid,
                action.filename
            );
            return {
                ...state,
                projects: {
                    ...state.projects,
                    [action.projectUid]: {
                        ...state.projects[action.projectUid],
                        documents: {
                            ...state.projects[action.projectUid].documents,
                            [action.documentUid]: newDocument
                        }
                    }
                }
            };
        }

        case ProjectsTypes.DOCUMENT_REMOVE_LOCALLY: {
            const action =
                unknownAction as ProjectsTypes.DocumentRemoveLocallyAction;
            const {
                [action.documentUid]: removedDocument,
                ...remainingDocuments
            } = state.projects[action.projectUid].documents;
            return {
                ...state,
                projects: {
                    ...state.projects,
                    [action.projectUid]: {
                        ...state.projects[action.projectUid],
                        documents: remainingDocuments
                    }
                }
            };
        }

        case ProjectsTypes.DOCUMENT_RESET: {
            const action = unknownAction as ProjectsTypes.DocumentResetAction;
            return state
                ? resetDocumentToSavedValue(
                      state,
                      action.projectUid,
                      action.documentUid
                  )
                : state;
        }

        case ProjectsTypes.DOCUMENT_SAVE: {
            const action = unknownAction as ProjectsTypes.DocumentSaveAction;

            return {
                ...state,
                projects: {
                    ...state.projects,
                    [action.projectUid]: {
                        ...state.projects[action.projectUid],
                        documents: {
                            ...state.projects[action.projectUid].documents,
                            [action.document.documentUid]: action.document
                        }
                    }
                }
            };
        }

        case ProjectsTypes.DOCUMENT_UPDATE_VALUE: {
            const action =
                unknownAction as ProjectsTypes.DocumentUpdateValueAction;

            if (!action.documentUid || !action.projectUid || !state)
                return state;

            const isModifiedLocally =
                action.val !==
                state.projects[action.projectUid].documents[action.documentUid]
                    .savedValue;

            return {
                ...state,
                projects: {
                    ...state.projects,
                    [action.projectUid]: {
                        ...state.projects[action.projectUid],
                        documents: {
                            ...state.projects[action.projectUid].documents,
                            [action.documentUid]: {
                                ...state.projects[action.projectUid].documents[
                                    action.documentUid
                                ],
                                isModifiedLocally,
                                currentValue: action.val
                            }
                        }
                    }
                }
            };
        }

        case ProjectsTypes.DOCUMENT_UPDATE_MODIFIED_LOCALLY: {
            const action =
                unknownAction as ProjectsTypes.DocumentUpdateModifiedLocallyAction;

            if (!action.documentUid || !state) return state;

            return {
                ...state,
                projects: {
                    ...state.projects,
                    [action.projectUid]: {
                        ...state.projects[action.projectUid],
                        documents: {
                            ...state.projects[action.projectUid].documents,
                            [action.documentUid]: {
                                ...state.projects[action.projectUid].documents[
                                    action.documentUid
                                ],
                                isModifiedLocally: action.isModified
                            }
                        }
                    }
                }
            };
        }

        case ProjectsTypes.DOCUMENT_RENAME_LOCALLY: {
            const action =
                unknownAction as ProjectsTypes.DocumentRenameLocallyAction;

            return typeof state.activeProjectUid !== "string"
                ? state
                : {
                      ...state,
                      projects: {
                          ...state.projects,
                          [state.activeProjectUid]: {
                              ...state.projects[state.activeProjectUid],
                              documents: {
                                  ...state.projects[state.activeProjectUid]
                                      .documents,
                                  [action.documentUid]: {
                                      ...state.projects[state.activeProjectUid]
                                          .documents[action.documentUid],
                                      filename: action.newFilename
                                  }
                              }
                          }
                      }
                  };
        }

        case ProjectsTypes.UPDATE_PROJECT_LAST_MODIFIED_LOCALLY: {
            const action =
                unknownAction as ProjectsTypes.UpdateProjectLastModifiedLocallyAction;

            if (
                state &&
                action.projectUid !== null &&
                action.projectUid === state.activeProjectUid
            ) {
                return typeof state.activeProjectUid !== "string"
                    ? state
                    : {
                          ...state,
                          projects: {
                              ...state.projects,
                              [state.activeProjectUid]: {
                                  ...state.projects[state.activeProjectUid],
                                  cachedProjectLastModified: action.timestamp
                              }
                          }
                      };
            }
            return state;
        }

        default: {
            return state;
        }
    }
};

export default ProjectsReducer;
