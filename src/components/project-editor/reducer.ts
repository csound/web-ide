// import { IStore } from "@store/types";
import { findIndex } from "lodash";
import {
    MANUAL_LOOKUP_STRING,
    TAB_DOCK_INIT,
    TAB_DOCK_REARRANGE_TABS,
    TAB_DOCK_SWITCH_TAB,
    TAB_DOCK_OPEN_NON_CLOUD_FILE,
    TAB_DOCK_OPEN_TAB_BY_DOCUMENT_UID,
    TAB_DOCK_CLOSE,
    TAB_CLOSE,
    TOGGLE_MANUAL_PANEL,
    SET_MANUAL_PANEL_OPEN,
    SET_FILE_TREE_PANEL_OPEN,
    ITabDock,
    IOpenDocument
} from "./types";
import { nonCloudFiles } from "../file-tree/actions";

export interface IProjectEditorReducer {
    tabDock: ITabDock;
    fileTreeVisible: boolean;
    manualVisible: boolean;
    manualLookupString: string;
}

const initialLayoutState = (): IProjectEditorReducer => ({
    tabDock: {
        tabIndex: -1,
        openDocuments: []
    },
    fileTreeVisible: true,
    manualVisible: false,
    manualLookupString: ""
});

const addTabToOpenDocuments = (
    tab: IOpenDocument,
    state: IProjectEditorReducer
) => {
    return {
        ...state,
        tabDock: {
            ...state.tabDock,
            openDocuments: [...state.tabDock.openDocuments, tab]
        }
    };
};

const storeTabDockState = (
    projectUid: string,
    openDocuments: IOpenDocument[],
    tabIndex: number | undefined
): void => {
    try {
        const tabOrder: string[] = openDocuments.map((doc) => doc.uid);
        const tabOrderString: string = JSON.stringify(tabOrder);
        localStorage.setItem(`${projectUid}:tabOrder`, tabOrderString);
        if (tabIndex !== undefined) {
            localStorage.setItem(`${projectUid}:tabIndex`, `${tabIndex}`);
        }
    } catch (error) {
        console.error(error);
    }
};

const ProjectEditorReducer = (
    state: IProjectEditorReducer | undefined,
    action: Record<string, any>
): IProjectEditorReducer => {
    if (!state) {
        return initialLayoutState();
    }

    switch (action.type) {
        case MANUAL_LOOKUP_STRING: {
            return {
                ...state,
                manualLookupString: action.manualLookupString,
                manualVisible: true
            };
        }
        case TAB_DOCK_CLOSE: {
            return initialLayoutState();
        }
        case TAB_DOCK_INIT: {
            return {
                ...state,
                tabDock: {
                    ...state.tabDock,
                    tabIndex: action.initialIndex,
                    openDocuments: action.initialOpenDocuments
                }
            };
        }
        case TAB_DOCK_SWITCH_TAB: {
            return {
                ...state,
                tabDock: {
                    ...state.tabDock,
                    tabIndex: action.tabIndex
                }
            };
        }
        case TAB_DOCK_REARRANGE_TABS: {
            return {
                ...state,
                tabDock: {
                    ...state.tabDock,
                    tabIndex: action.newActiveIndex,
                    openDocuments: action.modifiedDock
                }
            };
        }
        case TAB_DOCK_OPEN_NON_CLOUD_FILE: {
            if (action.init) {
                return state;
            }
            const currentOpenDocuments = state.tabDock.openDocuments;
            const documentAlreadyOpenIndex = findIndex(
                currentOpenDocuments,
                (od) =>
                    Boolean(
                        od.isNonCloudDocument && od.uid === action?.filename
                    )
            );
            const file = nonCloudFiles.get(action?.filename);

            if (file && documentAlreadyOpenIndex < 0) {
                let nonCloudFileAudioUrl;
                let nonCloudFileData;

                if (action.mimeType.startsWith("audio")) {
                    const blob = new Blob([file.buffer], {
                        type: action.mimeType
                    });
                    nonCloudFileAudioUrl = URL.createObjectURL(blob);
                } else {
                    const utf8decoder = new TextDecoder();
                    nonCloudFileData = utf8decoder.decode(file.buffer);
                }

                const newState = addTabToOpenDocuments(
                    {
                        uid: file.name,
                        isNonCloudDocument: true,
                        nonCloudFileAudioUrl,
                        nonCloudFileData,
                        editorInstance: undefined
                    },
                    state
                );

                newState.tabDock.tabIndex =
                    newState.tabDock.openDocuments.length - 1;

                storeTabDockState(
                    action.projectUid,
                    newState.tabDock.openDocuments,
                    newState.tabDock.tabIndex
                );

                return newState;
            } else {
                return {
                    ...state,
                    tabDock: {
                        ...state.tabDock,
                        tabIndex: documentAlreadyOpenIndex
                    }
                };
            }
        }
        case TAB_DOCK_OPEN_TAB_BY_DOCUMENT_UID: {
            const currentOpenDocuments = state.tabDock.openDocuments;
            const documentAlreadyOpenIndex = findIndex(
                currentOpenDocuments,
                (od) => od.uid === action.documentUid
            );

            if (documentAlreadyOpenIndex < 0 || action.init) {
                const newState = addTabToOpenDocuments(
                    {
                        uid: action.documentUid,
                        editorInstance: undefined
                    },
                    state
                );

                newState.tabDock.tabIndex =
                    newState.tabDock.openDocuments.length - 1;

                return newState;
            } else {
                return {
                    ...state,
                    tabDock: {
                        ...state.tabDock,
                        tabIndex: documentAlreadyOpenIndex
                    }
                };
            }
        }
        case TAB_CLOSE: {
            if (
                !state.tabDock.openDocuments.some(
                    (od) => od.uid === action.documentUid
                )
            ) {
                return state;
            }

            const currentTabIndex = state.tabDock.tabIndex;
            const newOpenDocuments = state.tabDock.openDocuments.filter(
                (od) => od.uid !== action.documentUid
            );

            const newTabIndex = Math.min(
                currentTabIndex,
                newOpenDocuments.length - 1
            );

            const newState = {
                ...state,
                tabDock: {
                    ...state.tabDock,
                    tabIndex: newTabIndex,
                    openDocuments: newOpenDocuments
                }
            };

            storeTabDockState(
                action.projectUid,
                newState.tabDock.openDocuments,
                newState.tabDock.tabIndex
            );

            return newState;
        }
        case TOGGLE_MANUAL_PANEL: {
            return {
                ...state,
                manualLookupString: "",
                manualVisible: !state.manualVisible
            };
        }
        case SET_MANUAL_PANEL_OPEN: {
            return {
                ...state,
                manualLookupString: "",
                manualVisible: action.open
            };
        }
        case SET_FILE_TREE_PANEL_OPEN: {
            return {
                ...state,
                fileTreeVisible: action.open
            };
        }
        default: {
            return state;
        }
    }
};

export default ProjectEditorReducer;
