import { find, pathOr, propEq, values } from "ramda";
import { IStore } from "@store/types";
import { IDocument, ITarget } from "../Projects/types";
import { playCSDFromEMFS } from "../Csound/actions";

const getDefaultTargetName = (store, projectUid): string | null =>
    pathOr(
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

export const getDefaultTargetDocument = (
    store,
    projectUid
): IDocument | null => {
    const maybeDefaultTarget: ITarget | null = pathOr(
        null,
        [
            "ProjectsReducer",
            "projects",
            projectUid,
            "documents",
            "targets",
            getDefaultTargetName(store, projectUid) || ""
        ],
        store
    );

    const projectCsdFallback =
        find(
            propEq("filename", "project.csd"),
            values(
                pathOr(
                    {},
                    ["ProjectsReducer", "projects", projectUid, "documents"],
                    store
                )
            )
        ) || null;

    // ATT: fallback to project.csd is to prevserve fallback behaviour
    // This should be marked as a deprecated fallback, soonish
    const targetDocument: IDocument | null = maybeDefaultTarget
        ? (pathOr as any)(
              null,
              [
                  "ProjectsReducer",
                  "projects",
                  projectUid,
                  "documents",
                  (maybeDefaultTarget as ITarget).targetType === "main"
                      ? maybeDefaultTarget &&
                        (maybeDefaultTarget as ITarget)!.targetDocumentUid
                      : maybeDefaultTarget &&
                        pathOr(
                            "",
                            ["playlistDocumentsUid", 0],
                            maybeDefaultTarget as ITarget
                        )
              ],
              store
          )
        : projectCsdFallback;

    return targetDocument;
};

export const getPlayActionFromProject = (store: IStore, projectUid: string) => {
    const targetDocument = getDefaultTargetDocument(store, projectUid);

    // const defaultTarget: ITarget | null = defaultTargetName
    //     ? pathOr(
    //           null,
    //           [
    //               "ProjectsReducer",
    //               "projects",
    //               projectUid,
    //               "documents",
    //               "targets",
    //               defaultTargetName
    //           ],
    //           store
    //       )
    //     : null;

    if (!targetDocument) return;
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

    const targetDocument: IDocument | null = target
        ? (pathOr as any)(
              null,
              [
                  "ProjectsReducer",
                  "projects",
                  activeProjectUid,
                  "documents",
                  target && (target as ITarget).targetType === "main"
                      ? target && (target as ITarget).targetDocumentUid
                      : target &&
                        pathOr(
                            "",
                            [
                                "playlistDocumentsUid",
                                selectedTargetPlaylistIndex
                            ],
                            target as ITarget
                        )
              ],
              store
          )
        : null;

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
