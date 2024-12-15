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
import {
    assoc,
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

const addTabToOpenDocuments = curry((tab, state) =>
    over(lensPath(["tabDock", "openDocuments"]), append(tab), state)
);

const storeTabDockState = (
    projectUid: string,
    openDocuments: IOpenDocument[],
    tabIndex: number | undefined
): void => {
    try {
        const tabOrder: string[] = map(prop("uid"), openDocuments);
        const tabOrderString: string = JSON.stringify(tabOrder);
        localStorage.setItem(`${projectUid}:tabOrder`, tabOrderString);
        tabIndex &&
            localStorage.setItem(`${projectUid}:tabIndex`, `${tabIndex}`);
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
            return pipe(
                assoc("manualLookupString", action.manualLookupString),
                assoc("manualVisible", true)
            )(state);
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
            return assocPath(["tabDock", "tabIndex"], action.tabIndex, state);
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
            const currentOpenDocuments: IOpenDocument[] = pathOr(
                [] as IOpenDocument[],
                ["tabDock", "openDocuments"],
                state
            );
            const documentAlreadyOpenIndex = findIndex(
                currentOpenDocuments,
                (od: IOpenDocument) =>
                    od.isNonCloudDocument ? od.uid === action?.filename : false
            );
            const file = nonCloudFiles.get(action?.filename);

            if (file && documentAlreadyOpenIndex < 0) {
                let nonCloudFileAudioUrl: string | undefined = undefined;
                let nonCloudFileData: string | undefined = undefined;

                if (action.mimeType.startsWith("audio")) {
                    const blob = new Blob([file.buffer], {
                        type: action.mimeType
                    });
                    nonCloudFileAudioUrl = URL.createObjectURL(blob);
                } else {
                    const utf8decoder = new TextDecoder();
                    nonCloudFileData = utf8decoder.decode(file.buffer);
                }

                const newAppendedState = addTabToOpenDocuments(
                    {
                        uid: file.name,
                        isNonCloudDocument: true,
                        nonCloudFileAudioUrl,
                        nonCloudFileData,
                        editorInstance: undefined
                    },
                    state
                );

                // Focus on open action (can be made configureable)
                const newState = assocPath(
                    ["tabDock", "tabIndex"],
                    newAppendedState.tabDock.openDocuments.length - 1,
                    newAppendedState
                );
                storeTabDockState(
                    action.projectUid,
                    newState.tabDock.openDocuments,
                    newState.tabDock.tabIndex
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
        case TAB_DOCK_OPEN_TAB_BY_DOCUMENT_UID: {
            const currentOpenDocuments: IOpenDocument[] = pathOr(
                [] as IOpenDocument[],
                ["tabDock", "openDocuments"],
                state
            );
            const documentAlreadyOpenIndex = findIndex(
                currentOpenDocuments,
                (od: IOpenDocument) => od.uid === action.documentUid
            );
            if (documentAlreadyOpenIndex < 0 || action.init) {
                const newAppendedState = addTabToOpenDocuments(
                    {
                        uid: action.documentUid,
                        editorInstance: undefined
                    },
                    state
                );

                // Focus on open action (can be made configureable)
                const newState = assocPath(
                    ["tabDock", "tabIndex"],
                    newAppendedState.tabDock.openDocuments.length - 1,
                    newAppendedState
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
                    (od) => od.uid === action.documentUid
                )
            ) {
                // dont attempt to close a tab that isn't open
                return state;
            }
            const currentTabIndex = state.tabDock.tabIndex;
            const newState: IProjectEditorReducer = (pipe as any)(
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
            )(state);
            storeTabDockState(
                action.projectUid,
                newState.tabDock.openDocuments,
                newState.tabDock.tabIndex
            );
            return newState;
        }
        case TOGGLE_MANUAL_PANEL: {
            return pipe(
                assoc("manualLookupString", ""),
                assoc("manualVisible", !state.manualVisible)
            )(state);
        }
        case SET_MANUAL_PANEL_OPEN: {
            return pipe(
                assoc("manualLookupString", ""),
                assoc("manualVisible", action.open)
            )(state);
        }
        case SET_FILE_TREE_PANEL_OPEN: {
            return assoc("fileTreeVisible", action.open, state);
        }
        default: {
            return state;
        }
    }
};

export default ProjectEditorReducer;
