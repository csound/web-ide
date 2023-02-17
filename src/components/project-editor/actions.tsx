import { openSimpleModal } from "@comp/modal/actions";
import { IDocument } from "@comp/projects/types";
import { ITarget } from "@comp/target-controls/types";
import { find, propEq } from "ramda";
import { sortByStoredTabOrder } from "./utils";
import {
    MANUAL_LOOKUP_STRING,
    TAB_DOCK_OPEN_NON_CLOUD_FILE,
    TAB_DOCK_OPEN_TAB_BY_DOCUMENT_UID,
    TAB_DOCK_CLOSE,
    TAB_DOCK_INIT,
    TAB_DOCK_REARRANGE_TABS,
    TAB_DOCK_SWITCH_TAB,
    TAB_CLOSE,
    TOGGLE_MANUAL_PANEL,
    SET_MANUAL_PANEL_OPEN,
    SET_FILE_TREE_PANEL_OPEN,
    IOpenDocument
} from "./types";

export const tabDockInit = (
    projectUid: string,
    allDocuments: IDocument[],
    defaultTarget: ITarget | undefined
): ((dispatch: any) => Promise<void>) => {
    const storedIndex = localStorage.getItem(projectUid + ":tabIndex");
    const storedTabOrder: string | null = localStorage.getItem(
        projectUid + ":tabOrder"
    );

    let initialOpenDocuments: IOpenDocument[] = [];
    let initialIndex = -1;

    if (
        storedTabOrder &&
        typeof storedTabOrder === "string" &&
        storedTabOrder.length > 0 &&
        storedTabOrder !== "[]"
    ) {
        try {
            const tabOrder = storedTabOrder
                ? (JSON.parse(storedTabOrder) as string[])
                : [];
            initialIndex = storedIndex
                ? (Number.parseInt(storedIndex) as number)
                : -1;
            if (tabOrder.length > 0) {
                initialOpenDocuments = sortByStoredTabOrder(
                    tabOrder,
                    allDocuments
                );
            }
            initialIndex = Math.min(
                initialOpenDocuments.length - 1,
                initialIndex
            );
        } catch (error) {
            console.error(error);
        }
    }
    if (
        defaultTarget &&
        defaultTarget.targetDocumentUid &&
        initialOpenDocuments.length === 0 &&
        allDocuments.length > 0
    ) {
        initialOpenDocuments.push({
            uid: defaultTarget.targetDocumentUid
        });
    } else if (
        defaultTarget &&
        defaultTarget.playlistDocumentsUid &&
        initialOpenDocuments.length === 0 &&
        allDocuments.length > 0
    ) {
        defaultTarget.playlistDocumentsUid.forEach((documentUid) => {
            initialOpenDocuments.push({
                uid: documentUid
            });
        });
    } else if (
        /* eslint-disable-next-line unicorn/no-useless-length-check */
        allDocuments.length > 0 &&
        /* eslint-disable-next-line unicorn/no-useless-length-check */
        allDocuments.some((d) => d.filename === "project.csd")
    ) {
        const projectCsd = find(
            propEq("filename", "project.csd"),
            allDocuments
        );
        projectCsd &&
            !find(
                propEq("uid", projectCsd.documentUid),
                initialOpenDocuments
            ) &&
            initialOpenDocuments.push({
                uid: projectCsd.documentUid
            });
    }

    if (initialOpenDocuments.length > 0 && initialIndex < 0) {
        initialIndex = 0;
    }

    return async (dispatch: any) => {
        dispatch({ type: TAB_DOCK_INIT, initialOpenDocuments, initialIndex });
    };
};

export const rearrangeTabs = (
    projectUid: string,
    modifiedDock: IOpenDocument[],
    newActiveIndex: number
): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        dispatch({
            type: TAB_DOCK_REARRANGE_TABS,
            projectUid,
            modifiedDock,
            newActiveIndex
        });
    };
};

export const tabOpenByDocumentUid = (
    documentUid: string,
    projectUid: string
): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        dispatch({
            type: TAB_DOCK_OPEN_TAB_BY_DOCUMENT_UID,
            documentUid,
            projectUid
        });
    };
};

export const tabOpenNonCloudDocument = (
    filename: string,
    mimeType: string
): {
    type: typeof TAB_DOCK_OPEN_NON_CLOUD_FILE;
    isNonCloudDocument: boolean;
    filename: string;
    mimeType: string;
} => {
    return {
        type: TAB_DOCK_OPEN_NON_CLOUD_FILE,
        isNonCloudDocument: true,
        filename,
        mimeType
    };
};

export const closeTabDock = () => {
    return {
        type: TAB_DOCK_CLOSE
    };
};

export const tabClose = (
    activeProjectUid: string,
    documentUid: string,
    isModified: boolean
) => {
    return isModified
        ? openSimpleModal("close-unsaved-prompt", {
              projectUid: activeProjectUid,
              documentUid
          })
        : {
              type: TAB_CLOSE,
              projectUid: activeProjectUid,
              documentUid
          };
};

export const tabSwitch = (index: number) => {
    return {
        type: TAB_DOCK_SWITCH_TAB,
        tabIndex: index
    };
};

export const lookupManualString = (manualLookupString?: string) => {
    return {
        type: MANUAL_LOOKUP_STRING,
        manualLookupString
    };
};

export const toggleManualPanel = () => {
    return {
        type: TOGGLE_MANUAL_PANEL
    };
};

export const setManualPanelOpen = (open: boolean) => {
    return {
        type: SET_MANUAL_PANEL_OPEN,
        open
    };
};

export const setFileTreePanelOpen = (open: boolean) => {
    return {
        type: SET_FILE_TREE_PANEL_OPEN,
        open
    };
};
