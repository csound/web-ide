import { getAuth } from "firebase/auth";
import { RootState } from "@store/types";
import { curry, equals, path, pathOr } from "ramda";
import { IOpenDocument } from "./types";

export const selectIsOwner: (
    projectUid: string
) => (store: RootState) => boolean = curry(
    (projectUid: string, store: RootState): boolean => {
        const currentUser = getAuth().currentUser;
        if (typeof currentUser !== "object") {
            return false;
        }
        const owner = pathOr(
            "",
            ["ProjectsReducer", "projects", projectUid, "userUid"],
            store
        );
        return equals(owner, (currentUser && currentUser.uid) || -1);
    }
);

export const selectTabDockIndex = (store: RootState): number =>
    pathOr(-1, ["ProjectEditorReducer", "tabDock", "tabIndex"], store);

export const selectCurrentTab = (
    store: RootState
): IOpenDocument | undefined => {
    const tabIndex = selectTabDockIndex(store);
    if (tabIndex > -1) {
        return path(
            ["ProjectEditorReducer", "tabDock", "openDocuments", tabIndex],
            store
        );
    }
};

export const selectCurrentTabDocumentUid = (
    store: RootState
): string | undefined => {
    const tabIndex = selectTabDockIndex(store);
    if (tabIndex > -1) {
        return path(
            [
                "ProjectEditorReducer",
                "tabDock",
                "openDocuments",
                tabIndex,
                "uid"
            ],
            store
        );
    }
};
