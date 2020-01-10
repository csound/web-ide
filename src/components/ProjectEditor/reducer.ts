import { findIndex } from "lodash";
import {
    MANUAL_LOOKUP_STRING,
    TAB_DOCK_INIT,
    TAB_DOCK_REARRANGE_TABS,
    TAB_DOCK_SWITCH_TAB,
    TAB_DOCK_OPEN_TAB_BY_DOCUMENT_UID,
    TAB_DOCK_CLOSE,
    TAB_CLOSE,
    TOGGLE_MANUAL_PANEL,
    SET_MANUAL_PANEL_OPEN,
    STORE_EDITOR_INSTANCE,
    ITabDock,
    IOpenDocument
} from "./types";
import {
    assocPath,
    append,
    curry,
    filter,
    lensPath,
    map,
    over,
    pathOr,
    pipe,
    prop
} from "ramda";

export interface IProjectEditorReducer {
    tabDock: ITabDock;
    secondaryPanel: "manual" | null;
    manualLookupString: string;
}

const initialLayoutState: IProjectEditorReducer = {
    tabDock: {
        tabIndex: -1,
        openDocuments: []
    },
    secondaryPanel: null,
    manualLookupString: ""
};

const addTabToOpenDocuments = curry((tab, state) =>
    over(lensPath(["tabDock", "openDocuments"]), append(tab), state)
);

const storeTabDockState = (
    projectUid: string,
    openDocuments: IOpenDocument[]
) => {
    try {
        const tabOrder: string[] = map(prop("uid"), openDocuments);
        const tabOrderStr: string = JSON.stringify(tabOrder);
        localStorage.setItem(`${projectUid}:tabOrder`, tabOrderStr);
    } catch (error) {
        console.error(error);
    }
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
        case TAB_DOCK_INIT: {
            return pipe(
                assocPath(["tabDock", "tabIndex"], action.initialIndex),
                assocPath(
                    ["tabDock", "openDocuments"],
                    action.initialOpenDocuments
                )
            )(state);
        }
        case TAB_DOCK_SWITCH_TAB: {
            return assocPath(["tabDock", "tabIndex"], action.tabIndex, state);
        }
        case TAB_DOCK_REARRANGE_TABS: {
            return pipe(
                assocPath(["tabDock", "tabIndex"], action.newActiveIndex),
                assocPath(["tabDock", "openDocuments"], action.modifiedDock)
            )(state);
        }
        case TAB_DOCK_OPEN_TAB_BY_DOCUMENT_UID: {
            const currentOpenDocs: IOpenDocument[] = pathOr(
                [] as IOpenDocument[],
                ["tabDock", "openDocuments"],
                state
            );

            const documentAlreadyOpenIndex = findIndex(
                currentOpenDocs,
                (od: IOpenDocument) => od.uid === action.documentUid
            );
            if ((documentAlreadyOpenIndex < 0 || action.init) && !action.hack) {
                const newState = addTabToOpenDocuments(
                    {
                        uid: action.documentUid,
                        editorInstance: null
                    },
                    state
                );
                storeTabDockState(
                    action.projectUid,
                    newState.tabDock.openDocuments
                );
                return newState;
            } else {
                return assocPath(
                    ["tabDock", "tabIndex"],
                    documentAlreadyOpenIndex,
                    state
                );
            }
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
            return pipe(
                assocPath(
                    ["tabDock", "tabIndex"],
                    Math.min(
                        currentTabIndex,
                        pathOr(
                            0,
                            ["tabDock", "openDocuments", "length"],
                            state
                        ) - 2
                    )
                ),
                assocPath(
                    ["tabDock", "openDocuments"],
                    filter(
                        (od: IOpenDocument) => od.uid !== action.documentUid,
                        pathOr([], ["tabDock", "openDocuments"], state)
                    )
                )
            )(state as IProjectEditorReducer);
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
            const openDocumentIndex = findIndex(
                state.tabDock.openDocuments,
                od => od.uid === action.documentUid
            );
            if (openDocumentIndex < 0) {
                return state;
            } else {
                return assocPath(
                    [
                        "tabDock",
                        "openDocuments",
                        openDocumentIndex,
                        "editorInstance"
                    ],
                    action.editorInstance,
                    state
                );
            }
        }
        default: {
            return state || initialLayoutState;
        }
    }
};
