import firebase from "firebase/app";
import "firebase/auth";
import { IStore } from "@store/types";
import { curry, equals, path, pathOr } from "ramda";
import { IOpenDocument } from "./types";

export const selectIsOwner: (
    projectUid: string
) => (store: IStore) => boolean = curry(
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
    if (tabIndex > -1) {
        return path(
            ["ProjectEditorReducer", "tabDock", "openDocuments", tabIndex],
            store
        );
    }
};
