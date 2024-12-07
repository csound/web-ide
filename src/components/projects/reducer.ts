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
import { RootState } from "@root/store";

type IProjectMap = { [projectUid: string]: IProject };

const initialProjectsState: IProjectsReducer = {
    activeProjectUid: "",
    projects: {} as IProjectMap
};
const resetDocumentToSavedValue = (
    state: RootState,
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

const ProjectsReducer = (
    state: IProjectsReducer | undefined,
    action: Record<string, any>
): IProjectsReducer => {
    if (state) {
        switch (action.type) {
            case STORE_PROJECT_LOCALLY: {
                if (!action.projects || action.projects.length === 0) {
                    return state;
                }

                const newState = action.projects.reduce((st, proj) => {
                    const existingProject =
                        st.projects?.[proj.projectUid] || {};

                    return st.projects?.[proj.projectUid]
                        ? {
                              ...st,
                              projects: {
                                  ...st.projects,
                                  [proj.projectUid]: {
                                      ...existingProject,
                                      ...Object.entries(proj).reduce(
                                          (acc, [key, value]) => {
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

            case UNSET_PROJECT: {
                const {
                    [action.projectUid]: removedProject,
                    ...remainingProjects
                } = state.projects;
                return {
                    ...state,
                    projects: remainingProjects
                };
            }

            case ADD_PROJECT_DOCUMENTS: {
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

            case SET_PROJECT_PUBLIC: {
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

            case ACTIVATE_PROJECT: {
                return { ...state, activeProjectUid: action.projectUid };
            }

            case CLOSE_PROJECT: {
                const { activeProjectUid, ...remainingState } = state;
                return remainingState;
            }

            case STORE_PROJECT_STARS: {
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

            case DOCUMENT_INITIALIZE: {
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

            case DOCUMENT_REMOVE_LOCALLY: {
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

            case DOCUMENT_UPDATE_VALUE: {
                if (!action.documentUid || !action.projectUid || !state)
                    return state;

                const isModifiedLocally =
                    action.val !==
                    state.projects[action.projectUid].documents[
                        action.documentUid
                    ].savedValue;

                return {
                    ...state,
                    projects: {
                        ...state.projects,
                        [action.projectUid]: {
                            ...state.projects[action.projectUid],
                            documents: {
                                ...state.projects[action.projectUid].documents,
                                [action.documentUid]: {
                                    ...state.projects[action.projectUid]
                                        .documents[action.documentUid],
                                    isModifiedLocally,
                                    currentValue: action.val
                                }
                            }
                        }
                    }
                };
            }

            case DOCUMENT_UPDATE_MODIFIED_LOCALLY: {
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
                                    ...state.projects[action.projectUid]
                                        .documents[action.documentUid],
                                    isModifiedLocally: action.isModified
                                }
                            }
                        }
                    }
                };
            }

            case DOCUMENT_RENAME_LOCALLY: {
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
                                          ...state.projects[
                                              state.activeProjectUid
                                          ].documents[action.documentUid],
                                          filename: action.newFilename
                                      }
                                  }
                              }
                          }
                      };
            }

            case UPDATE_PROJECT_LAST_MODIFIED_LOCALLY: {
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
                                      cachedProjectLastModified:
                                          action.timestamp
                                  }
                              }
                          };
                }
                return state;
            }

            default: {
                return state || initialProjectsState;
            }
        }
    } else {
        return initialProjectsState;
    }
};

export default ProjectsReducer;
