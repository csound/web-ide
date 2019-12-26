import { pathOr } from "ramda";
import { IStore } from "@root/db/interfaces";
import { IDocument, ITarget, IMainTarget, IPlaylist } from "../Projects/types";
import { playCSDFromEMFS } from "../Csound/actions";

export const getPlayActionFromTarget = (store: IStore) => {
    const selectedTarget = pathOr(
        null,
        ["TargetControlsReducer", "selectedTarget"],
        store
    );

    const selectedTargetPlaylistIndex = pathOr(
        -1,
        ["TargetControlsReducer", "selectedTargetPlaylistIndex"],
        store
    );

    const activeProjectUid = pathOr(
        null,
        ["ProjectsReducer", "activeProjectUid"],
        store
    );
    if (selectedTarget === null || activeProjectUid === null) {
        return null;
    }

    const target: ITarget | null = pathOr(
        null,
        [
            "ProjectsReducer",
            "projects",
            activeProjectUid,
            "targets",
            selectedTarget
        ],
        store
    );

    if (!target) return null;

    const targetDocument: IDocument | null = pathOr(
        null,
        [
            "ProjectsReducer",
            "projects",
            activeProjectUid,
            "documents",
            (target as ITarget).targetType === "main"
                ? (target as IMainTarget).targetDocumentUid
                : (target as IPlaylist).playlistDocumentsUid[
                      selectedTargetPlaylistIndex
                  ]
        ],
        store
    );

    if (targetDocument && (targetDocument as IDocument).type) {
        switch ((targetDocument as IDocument).type) {
            case "csd": {
                return playCSDFromEMFS((targetDocument as IDocument).filename);
            }
            default: {
                return null;
            }
        }
    } else {
        return null;
    }
};
