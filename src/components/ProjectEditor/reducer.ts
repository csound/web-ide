import { filter, find, findIndex } from "lodash";
import {
    MANUAL_LOOKUP_STRING,
    TAB_DOCK_INIT_SWITCH_TAB,
    TAB_DOCK_SWITCH_TAB,
    TAB_DOCK_INITIAL_OPEN_TAB_BY_DOCUMENT_UID,
    TAB_DOCK_OPEN_TAB_BY_DOCUMENT_UID,
    TAB_DOCK_CLOSE,
    TAB_CLOSE,
    TOGGLE_MANUAL_PANEL,
    SET_MANUAL_PANEL_OPEN,
    STORE_EDITOR_INSTANCE,
    ITabDock
} from "./types";
import { assocPath, append, pathOr } from "ramda";

export interface IProjectEditorReducer {
    tabDock: ITabDock;
    secondaryPanel: "manual" | null;
    manualLookupString: string | null;
}

const initialLayoutState: IProjectEditorReducer = {
    tabDock: {
        tabIndex: -1,
        openDocuments: []
    },
    secondaryPanel: null,
    manualLookupString: null
};

export default (
    state: IProjectEditorReducer = initialLayoutState,
    action: any
) => {
    switch (action.type) {
        case MANUAL_LOOKUP_STRING: {
            return {
                ...state,
                secondaryPanel: "manual",
                manualLookupString: action.manualLookupString
            } as IProjectEditorReducer;
        }
        case TAB_DOCK_CLOSE: {
            return {
                ...state,
                tabDock: {
                    tabIndex: -1,
                    openDocuments: []
                },
                secondaryPanel: state.secondaryPanel,
                manualLookupString: state.manualLookupString
            };
        }
        case TAB_DOCK_INIT_SWITCH_TAB: {
            if (state.tabDock.tabIndex < 0) {
                state.tabDock.tabIndex = 0;
                return { ...state };
            } else {
                return state;
            }
        }
        case TAB_DOCK_SWITCH_TAB: {
            state.tabDock.tabIndex = action.tabIndex;
            return { ...state };
        }
        case TAB_DOCK_INITIAL_OPEN_TAB_BY_DOCUMENT_UID: {
            if (state.tabDock.tabIndex < 0) {
                state = assocPath(
                    ["tabDock", "openDocuments"],
                    append(
                        {
                            uid: action.documentUid,
                            editorInstance: null
                        },
                        pathOr([], ["tabDock", "openDocuments"], state)
                    ),
                    state
                );
                return { ...state };
            } else {
                return state;
            }
        }
        case TAB_DOCK_OPEN_TAB_BY_DOCUMENT_UID: {
            const currentOpenDocs = state.tabDock.openDocuments;
            const documentAlreadyOpenIndex = findIndex(
                currentOpenDocs,
                od => od.uid === action.documentUid
            );
            if (documentAlreadyOpenIndex < 0) {
                state = assocPath(
                    ["tabDock", "tabIndex"],
                    currentOpenDocs.length,
                    state
                );
                state = assocPath(
                    ["tabDock", "openDocuments"],
                    append(
                        {
                            uid: action.documentUid,
                            editorInstance: null
                        },
                        pathOr([], ["tabDock", "openDocuments"], state)
                    ),
                    state
                );
            } else {
                state = assocPath(
                    ["tabDock", "tabIndex"],
                    documentAlreadyOpenIndex,
                    state
                );
            }
            return state;
        }
        case TAB_CLOSE: {
            if (
                !state.tabDock.openDocuments.some(
                    od => od.uid === action.documentUid
                )
            ) {
                // dont attempt to close a tab that isn't open
                return state;
            }
            const currentTabIndex = state.tabDock.tabIndex;
            state.tabDock.tabIndex = Math.min(
                currentTabIndex,
                state.tabDock.openDocuments.length - 2
            );
            state.tabDock.openDocuments = filter(
                state.tabDock.openDocuments,
                od => od.uid !== action.documentUid
            );
            return { ...state };
        }
        case TOGGLE_MANUAL_PANEL: {
            const secondaryPanel =
                state.secondaryPanel === "manual" ? null : "manual";
            return { ...state, secondaryPanel } as IProjectEditorReducer;
        }
        case SET_MANUAL_PANEL_OPEN: {
            return {
                ...state,
                secondaryPanel: action.open ? "manual" : state.secondaryPanel
            } as IProjectEditorReducer;
        }
        case STORE_EDITOR_INSTANCE: {
            const openDocument = find(
                state.tabDock.openDocuments,
                od => od.uid === action.documentUid
            );

            if (!openDocument) {
                return state;
            }
            openDocument.editorInstance = action.editorInstance;
            return { ...state };
        }
        default: {
            return state || initialLayoutState;
        }
    }
};
