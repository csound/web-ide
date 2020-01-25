import { curry, find, pathOr, propEq, values } from "ramda";
import { IStore } from "@store/types";
import { ITarget } from "./types";
import { IDocument } from "@comp/Projects/types";
import { playORCFromString, playCSDFromEMFS } from "@comp/Csound/actions";
import { filenameToCsoundType } from "@comp/Csound/utils";

const getDefaultTargetName = (store, projectUid): string | null =>
    pathOr(null, ["TargetControlsReducer", projectUid, "defaultTarget"], store);

export const getDefaultTargetDocument = curry(
    (projectUid, store): IDocument | null => {
        const maybeDefaultTarget: ITarget | null = pathOr(
            null,
            [
                "TargetControlsReducer",
                projectUid,
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
                        [
                            "ProjectsReducer",
                            "projects",
                            projectUid,
                            "documents"
                        ],
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
    }
);

export const getPlayActionFromProject = curry(
    (projectUid: string, store: IStore) => {
        const targetDocument = getDefaultTargetDocument(projectUid, store);
        if (!targetDocument) return;
        const csoundDocType = filenameToCsoundType(
            (targetDocument as IDocument).filename
        );
        switch (csoundDocType) {
            case "csd": {
                return playCSDFromEMFS((targetDocument as IDocument).filename);
            }
            case "orc": {
                return playORCFromString(
                    (targetDocument as IDocument).savedValue
                );
            }
        }
    }
);

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

    if (targetDocument && (targetDocument as IDocument).filename) {
        const csoundDocType = filenameToCsoundType(
            (targetDocument as IDocument).filename
        );
        switch (csoundDocType) {
            case "csd": {
                return playCSDFromEMFS((targetDocument as IDocument).filename);
            }
            case "orc": {
                return playORCFromString(
                    (targetDocument as IDocument).savedValue
                );
            }
        }
    }
};
