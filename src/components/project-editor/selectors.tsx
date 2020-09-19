import * as firebase from "firebase/app";
import { IStore } from "@store/types";
import { curry, equals, path, pathOr } from "ramda";
import { IOpenDocument } from "./types";

export const selectIsOwner = curry(
    (projectUid: string, store: IStore): boolean => {
        const currentUser = firebase.auth().currentUser;
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

export const selectTabDockIndex = (store: IStore) =>
    pathOr(-1, ["ProjectEditorReducer", "tabDock", "tabIndex"], store);

export const selectCurrentTab = (store: IStore): IOpenDocument | undefined => {
    const tabIndex = selectTabDockIndex(store);
    if (tabIndex < 0) {
        return;
    } else {
        return path(
            ["ProjectEditorReducer", "tabDock", "openDocuments", tabIndex],
            store
        );
    }
};
