import { pathOr } from "ramda";
import { IStore } from "@store/types";
import { IDocument, ITarget, IMainTarget, IPlaylist } from "../Projects/types";
import { playCSDFromEMFS } from "../Csound/actions";

export const getPlayActionFromProject = (store: IStore, projectUid: string) => {
    const defaultTargetName: string | null = pathOr(
        null,
        [
            "ProjectsReducer",
            "projects",
            projectUid,
            "documents",
            "defaultTarget"
        ],
        store
    );

    const defaultTarget: ITarget | null = defaultTargetName
        ? pathOr(
              null,
              [
                  "ProjectsReducer",
                  "projects",
                  projectUid,
                  "documents",
                  "targets",
                  defaultTargetName
              ],
              store
          )
        : null;

    // ATT: fallback to project.csd is to prevserve fallback behaviour
    // This should be marked as a deprecated fallback, soonish
    const targetDocument: IDocument = defaultTarget
        ? pathOr(
              { type: "csd", filename: "project.csd" } as IDocument,
              [
                  "ProjectsReducer",
                  "projects",
                  projectUid,
                  "documents",
                  (defaultTarget as ITarget).targetType === "main"
                      ? (defaultTarget as IMainTarget).targetDocumentUid
                      : (defaultTarget as IPlaylist).playlistDocumentsUid[0]
              ],
              store
          )
        : ({ type: "csd", filename: "project.csd" } as IDocument);

    switch ((targetDocument as IDocument).type) {
        case "csd": {
            return playCSDFromEMFS((targetDocument as IDocument).filename);
        }
        default: {
            return null;
        }
    }
};

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
